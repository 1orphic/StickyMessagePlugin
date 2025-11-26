/**
 * @name StickyMessageAutoResend
 * @author BetterDiscord Community
 * @description Automatically resends tracked messages if they get deleted. Press Ctrl+Shift+T to open tracking sidebar, then click "Select Message" to track by clicking.
 * @version 2.3.0
 * @authorId 0
 * @website https://github.com
 * @source https://github.com
 */

module.exports = class StickyMessageAutoResend {
    constructor() {
        this.trackedMessages = new Map();
        this.messageDeleteHandler = null;
        this.messageCreateHandler = null;
        this.keyboardHandler = null;
        this.sidebarElement = null;
        this.selectionModeActive = false;
        this.selectionOverlay = null;
        this.messageClickHandler = null;
    }

    getName() { return "StickyMessageAutoResend"; }
    getAuthor() { return "BetterDiscord Community"; }
    getDescription() { return "Automatically resends tracked messages if they get deleted. Press Ctrl+Shift+T to open tracking sidebar, then click 'Select Message' to track by clicking."; }
    getVersion() { return "2.3.0"; }

    start() {
        this.loadSettings();
        this.patchContextMenu();
        this.startMessageDeleteListener();
        this.registerKeyboardShortcut();
        BdApi.UI.showToast("StickyMessageAutoResend has started! Press Ctrl+Shift+T to open tracking sidebar.", { type: "success" });
    }

    stop() {
        this.exitSelectionMode();
        this.stopMessageDeleteListener();
        this.unregisterKeyboardShortcut();
        this.closeSidebar();
        BdApi.Patcher.unpatchAll(this.getName());
        BdApi.UI.showToast("StickyMessageAutoResend has stopped!", { type: "info" });
    }

    loadSettings() {
        const savedMessages = BdApi.Data.load(this.getName(), "trackedMessages");
        if (savedMessages) {
            try {
                const parsed = JSON.parse(savedMessages);
                this.trackedMessages = new Map(Object.entries(parsed));
            } catch (e) {
                console.error("Failed to load tracked messages:", e);
                this.trackedMessages = new Map();
            }
        }
    }

    saveSettings() {
        const obj = Object.fromEntries(this.trackedMessages);
        BdApi.Data.save(this.getName(), "trackedMessages", JSON.stringify(obj));
    }

    patchContextMenu() {
        try {
            const MessageContextMenu = BdApi.ContextMenu.getDiscordMenu("MessageContextMenu");
            
            if (!MessageContextMenu) {
                console.warn("[StickyMessageAutoResend] MessageContextMenu not found, trying alternative method");
                this.patchContextMenuAlternative();
                return;
            }
            
            BdApi.Patcher.after(this.getName(), MessageContextMenu, "default", (_, [props], returnValue) => {
                try {
                    if (!returnValue || !props?.message) return;
                    
                    const message = props.message;
                    const isTracked = this.trackedMessages.has(message.id);
                    
                    const menuItem = BdApi.ContextMenu.buildItem({
                        type: "text",
                        label: isTracked ? "Untrack Message" : "Track Message (Auto-Resend)",
                        id: "sticky-message-track",
                        action: () => {
                            if (isTracked) {
                                this.untrackMessage(message.id);
                                BdApi.UI.showToast("Message untracked", { type: "info" });
                            } else {
                                this.trackMessage(message);
                                BdApi.UI.showToast("Message is now being tracked!", { type: "success" });
                            }
                        }
                    });
                    
                    if (!returnValue?.props?.children) {
                        console.warn("[StickyMessageAutoResend] Context menu children not found");
                        return;
                    }
                    
                    if (Array.isArray(returnValue.props.children)) {
                        returnValue.props.children.push(menuItem);
                    } else {
                        returnValue.props.children = [returnValue.props.children, menuItem];
                    }
                } catch (err) {
                    console.error("[StickyMessageAutoResend] Error in context menu patch:", err);
                }
            });
        } catch (err) {
            console.error("[StickyMessageAutoResend] Failed to patch context menu:", err);
        }
    }

    patchContextMenuAlternative() {
        try {
            const MessageContextMenu = BdApi.Webpack.getModule(
                m => m?.default?.displayName === "MessageContextMenu"
            );
            
            if (!MessageContextMenu) {
                console.error("[StickyMessageAutoResend] Could not find MessageContextMenu module");
                BdApi.UI.showToast("Context menu patch failed. Check console for details.", { type: "error" });
                return;
            }
            
            BdApi.Patcher.after(this.getName(), MessageContextMenu, "default", (_, [props], returnValue) => {
                try {
                    if (!returnValue || !props?.message) return;
                    
                    const message = props.message;
                    const isTracked = this.trackedMessages.has(message.id);
                    
                    const menuItem = BdApi.ContextMenu.buildItem({
                        type: "text",
                        label: isTracked ? "Untrack Message" : "Track Message (Auto-Resend)",
                        id: "sticky-message-track",
                        action: () => {
                            if (isTracked) {
                                this.untrackMessage(message.id);
                                BdApi.UI.showToast("Message untracked", { type: "info" });
                            } else {
                                this.trackMessage(message);
                                BdApi.UI.showToast("Message is now being tracked!", { type: "success" });
                            }
                        }
                    });
                    
                    if (!returnValue?.props?.children) {
                        console.warn("[StickyMessageAutoResend] Context menu children not found");
                        return;
                    }
                    
                    if (Array.isArray(returnValue.props.children)) {
                        returnValue.props.children.push(menuItem);
                    } else {
                        returnValue.props.children = [returnValue.props.children, menuItem];
                    }
                } catch (err) {
                    console.error("[StickyMessageAutoResend] Error in alternative context menu patch:", err);
                }
            });
        } catch (err) {
            console.error("[StickyMessageAutoResend] Failed to apply alternative context menu patch:", err);
        }
    }

    trackMessage(message) {
        const messageData = {
            id: message.id,
            channelId: message.channel_id,
            content: message.content,
            embeds: message.embeds,
            attachments: message.attachments,
            author: {
                id: message.author.id,
                username: message.author.username,
                discriminator: message.author.discriminator
            },
            timestamp: message.timestamp
        };

        this.trackedMessages.set(message.id, messageData);
        this.saveSettings();
    }

    untrackMessage(messageId) {
        this.trackedMessages.delete(messageId);
        this.saveSettings();
    }

    startMessageDeleteListener() {
        // Get the Dispatcher module using native BetterDiscord Webpack API
        const Dispatcher = BdApi.Webpack.getModule(
            m => m?.subscribe && m?.dispatch
        );
        
        if (Dispatcher) {
            this.messageDeleteHandler = (event) => {
                if (event.type === "MESSAGE_DELETE") {
                    this.handleMessageDelete(event);
                }
            };
            
            Dispatcher.subscribe("MESSAGE_DELETE", this.messageDeleteHandler);
        }
    }

    stopMessageDeleteListener() {
        if (this.messageDeleteHandler) {
            const Dispatcher = BdApi.Webpack.getModule(
                m => m?.subscribe && m?.dispatch
            );
            if (Dispatcher) {
                Dispatcher.unsubscribe("MESSAGE_DELETE", this.messageDeleteHandler);
            }
            this.messageDeleteHandler = null;
        }
        
        if (this.messageCreateHandler) {
            const Dispatcher = BdApi.Webpack.getModule(
                m => m?.subscribe && m?.dispatch
            );
            if (Dispatcher) {
                Dispatcher.unsubscribe("MESSAGE_CREATE", this.messageCreateHandler);
            }
            this.messageCreateHandler = null;
        }
    }

    handleMessageDelete(event) {
        const { id, channelId } = event;
        
        if (this.trackedMessages.has(id)) {
            const messageData = this.trackedMessages.get(id);
            
            setTimeout(() => {
                this.resendMessage(messageData);
            }, 500);
        }
    }

    async resendMessage(messageData) {
        try {
            // Get ChannelStore using native BetterDiscord Webpack API
            const ChannelStore = BdApi.Webpack.getModule(
                m => m?.getChannel && m?.hasChannel
            );
            
            if (!ChannelStore) {
                BdApi.UI.showToast("Cannot resend message: ChannelStore not found", { type: "error" });
                return;
            }
            
            const channel = ChannelStore.getChannel(messageData.channelId);
            
            if (!channel) {
                BdApi.UI.showToast("Cannot resend message: Channel not found", { type: "error" });
                return;
            }

            // Get MessageActions using native BetterDiscord Webpack API
            const MessageActions = BdApi.Webpack.getModule(
                m => m?.sendMessage && m?.receiveMessage
            );
            
            if (!MessageActions) {
                BdApi.UI.showToast("Cannot resend message: MessageActions not found", { type: "error" });
                return;
            }

            // Try to get MessageQueue for sending
            const MessageQueue = BdApi.Webpack.getModule(
                m => m?.enqueue && m?.handleSend
            );

            const messagePayload = {
                content: messageData.content || "",
                tts: false,
                invalidEmojis: [],
                validNonShortcutEmojis: []
            };

            if (MessageQueue && MessageQueue.enqueue) {
                MessageQueue.enqueue({
                    type: 0,
                    message: {
                        channelId: messageData.channelId,
                        ...messagePayload
                    }
                }, () => {});
            } else if (MessageActions && MessageActions.sendMessage) {
                MessageActions.sendMessage(messageData.channelId, messagePayload);
            }

            const newMessage = await this.waitForNewMessage(messageData.channelId, messageData.content);
            
            if (newMessage) {
                this.trackedMessages.delete(messageData.id);
                this.trackedMessages.set(newMessage.id, {
                    ...messageData,
                    id: newMessage.id,
                    timestamp: newMessage.timestamp
                });
                this.saveSettings();
            }

            BdApi.UI.showToast("Tracked message resent successfully!", { type: "success" });
        } catch (error) {
            console.error("Failed to resend message:", error);
            BdApi.UI.showToast("Failed to resend message. Check console for details.", { type: "error" });
        }
    }

    async waitForNewMessage(channelId, content, timeout = 3000) {
        return new Promise((resolve) => {
            let found = false;
            
            const Dispatcher = BdApi.Webpack.getModule(
                m => m?.subscribe && m?.dispatch
            );
            
            const UserStore = BdApi.Webpack.getModule(
                m => m?.getCurrentUser && m?.getUser
            );
            
            if (!Dispatcher || !UserStore) {
                resolve(null);
                return;
            }
            
            const handler = (event) => {
                if (event.type === "MESSAGE_CREATE" && event.channelId === channelId) {
                    const currentUser = UserStore.getCurrentUser();
                    if (event.message.content === content && event.message.author.id === currentUser.id) {
                        found = true;
                        Dispatcher.unsubscribe("MESSAGE_CREATE", handler);
                        resolve(event.message);
                    }
                }
            };
            
            this.messageCreateHandler = handler;
            Dispatcher.subscribe("MESSAGE_CREATE", handler);
            
            setTimeout(() => {
                if (!found) {
                    Dispatcher.unsubscribe("MESSAGE_CREATE", handler);
                    this.messageCreateHandler = null;
                    resolve(null);
                }
            }, timeout);
        });
    }

    getSettingsPanel() {
        // Get ChannelStore for settings panel
        const ChannelStore = BdApi.Webpack.getModule(
            m => m?.getChannel && m?.hasChannel
        );
        
        const panel = document.createElement("div");
        panel.style.padding = "20px";
        panel.style.color = "var(--text-normal)";
        
        const title = document.createElement("h2");
        title.textContent = "Tracked Messages";
        title.style.marginBottom = "15px";
        panel.appendChild(title);

        if (this.trackedMessages.size === 0) {
            const emptyMessage = document.createElement("p");
            emptyMessage.textContent = "No messages are currently being tracked.";
            emptyMessage.style.color = "var(--text-muted)";
            emptyMessage.style.fontStyle = "italic";
            panel.appendChild(emptyMessage);
        } else {
            const list = document.createElement("div");
            list.style.display = "flex";
            list.style.flexDirection = "column";
            list.style.gap = "10px";

            this.trackedMessages.forEach((messageData, messageId) => {
                const item = document.createElement("div");
                item.style.padding = "10px";
                item.style.backgroundColor = "var(--background-secondary)";
                item.style.borderRadius = "5px";
                item.style.display = "flex";
                item.style.justifyContent = "space-between";
                item.style.alignItems = "center";

                const info = document.createElement("div");
                info.style.flex = "1";
                
                const contentPreview = document.createElement("div");
                contentPreview.textContent = messageData.content.substring(0, 100) + (messageData.content.length > 100 ? "..." : "");
                contentPreview.style.marginBottom = "5px";
                contentPreview.style.fontWeight = "500";
                
                const metadata = document.createElement("div");
                metadata.style.fontSize = "12px";
                metadata.style.color = "var(--text-muted)";
                
                const channel = ChannelStore ? ChannelStore.getChannel(messageData.channelId) : null;
                const channelName = channel ? `#${channel.name}` : "Unknown Channel";
                metadata.textContent = `Channel: ${channelName} | Author: ${messageData.author.username}`;
                
                info.appendChild(contentPreview);
                info.appendChild(metadata);

                const removeBtn = document.createElement("button");
                removeBtn.textContent = "Untrack";
                removeBtn.style.padding = "5px 15px";
                removeBtn.style.backgroundColor = "var(--button-danger-background)";
                removeBtn.style.color = "white";
                removeBtn.style.border = "none";
                removeBtn.style.borderRadius = "3px";
                removeBtn.style.cursor = "pointer";
                removeBtn.onclick = () => {
                    this.untrackMessage(messageId);
                    BdApi.UI.showToast("Message untracked", { type: "info" });
                    item.remove();
                    
                    if (list.children.length === 0) {
                        const emptyMessage = document.createElement("p");
                        emptyMessage.textContent = "No messages are currently being tracked.";
                        emptyMessage.style.color = "var(--text-muted)";
                        emptyMessage.style.fontStyle = "italic";
                        list.appendChild(emptyMessage);
                    }
                };

                item.appendChild(info);
                item.appendChild(removeBtn);
                list.appendChild(item);
            });

            panel.appendChild(list);
        }

        const instructions = document.createElement("div");
        instructions.style.marginTop = "20px";
        instructions.style.padding = "15px";
        instructions.style.backgroundColor = "var(--background-secondary)";
        instructions.style.borderRadius = "5px";
        instructions.style.fontSize = "14px";
        instructions.innerHTML = `
            <h3 style="margin-top: 0; margin-bottom: 10px;">How to use:</h3>
            <ol style="margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 5px;"><strong>Recommended:</strong> Press <kbd style="background: var(--background-modifier-accent); padding: 2px 6px; border-radius: 3px; font-family: monospace;">Ctrl+Shift+T</kbd> to open the tracking sidebar</li>
                <li style="margin-bottom: 5px;"><strong>Click "Select Message" button</strong> in the sidebar to enter selection mode, then click any message to track it</li>
                <li style="margin-bottom: 5px;">Or paste a Discord message link in the sidebar to track it</li>
                <li style="margin-bottom: 5px;">Or right-click on any message and select "Track Message (Auto-Resend)"</li>
                <li style="margin-bottom: 5px;">The message will automatically be resent if deleted</li>
                <li>To stop tracking, use the sidebar, right-click the message, or use this panel</li>
            </ol>
        `;
        panel.appendChild(instructions);

        return panel;
    }

    registerKeyboardShortcut() {
        this.keyboardHandler = (event) => {
            // Ctrl+Shift+T to open the tracking sidebar
            if (event.ctrlKey && event.shiftKey && event.key === 'T') {
                event.preventDefault();
                event.stopPropagation();
                this.toggleSidebar();
            }
        };
        document.addEventListener('keydown', this.keyboardHandler, true);
    }

    unregisterKeyboardShortcut() {
        if (this.keyboardHandler) {
            document.removeEventListener('keydown', this.keyboardHandler, true);
            this.keyboardHandler = null;
        }
    }

    toggleSidebar() {
        if (this.sidebarElement) {
            this.closeSidebar();
        } else {
            this.openSidebar();
        }
    }

    openSidebar() {
        if (this.sidebarElement) {
            return;
        }

        // Create overlay backdrop
        const backdrop = document.createElement('div');
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            animation: fadeIn 0.2s ease-out;
        `;

        // Create sidebar container
        const sidebar = document.createElement('div');
        sidebar.style.cssText = `
            position: fixed;
            top: 0;
            right: 0;
            width: 450px;
            max-width: 90vw;
            height: 100%;
            background-color: var(--background-primary);
            box-shadow: -2px 0 10px rgba(0, 0, 0, 0.3);
            z-index: 1001;
            display: flex;
            flex-direction: column;
            animation: slideInRight 0.3s ease-out;
        `;

        // Add animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideInRight {
                from { transform: translateX(100%); }
                to { transform: translateX(0); }
            }
        `;
        document.head.appendChild(style);

        // Create header
        const header = document.createElement('div');
        header.style.cssText = `
            padding: 20px;
            border-bottom: 1px solid var(--background-modifier-accent);
            display: flex;
            justify-content: space-between;
            align-items: center;
            background-color: var(--background-secondary);
        `;

        const title = document.createElement('h2');
        title.style.cssText = `
            margin: 0;
            color: var(--header-primary);
            font-size: 18px;
            font-weight: 600;
        `;
        title.textContent = 'Track Messages';

        const closeButton = document.createElement('button');
        closeButton.innerHTML = '×';
        closeButton.style.cssText = `
            background: none;
            border: none;
            color: var(--interactive-normal);
            font-size: 28px;
            cursor: pointer;
            padding: 0;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            transition: background-color 0.1s, color 0.1s;
        `;
        closeButton.onmouseover = () => {
            closeButton.style.backgroundColor = 'var(--background-modifier-hover)';
            closeButton.style.color = 'var(--interactive-hover)';
        };
        closeButton.onmouseout = () => {
            closeButton.style.backgroundColor = 'transparent';
            closeButton.style.color = 'var(--interactive-normal)';
        };
        closeButton.onclick = () => this.closeSidebar();

        header.appendChild(title);
        header.appendChild(closeButton);

        // Create content container
        const content = document.createElement('div');
        content.style.cssText = `
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 20px;
        `;

        // Create message link input section
        const inputSection = document.createElement('div');
        inputSection.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;

        const inputLabel = document.createElement('label');
        inputLabel.style.cssText = `
            color: var(--header-primary);
            font-size: 14px;
            font-weight: 600;
        `;
        inputLabel.textContent = 'Paste Message Link:';

        const inputContainer = document.createElement('div');
        inputContainer.style.cssText = `
            display: flex;
            gap: 8px;
        `;

        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'https://discord.com/channels/.../...';
        input.style.cssText = `
            flex: 1;
            padding: 10px;
            background-color: var(--input-background);
            color: var(--text-normal);
            border: 1px solid var(--background-modifier-accent);
            border-radius: 4px;
            font-size: 14px;
            outline: none;
        `;
        input.onfocus = () => {
            input.style.borderColor = 'var(--brand-experiment)';
        };
        input.onblur = () => {
            input.style.borderColor = 'var(--background-modifier-accent)';
        };
        input.onkeydown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                trackButton.click();
            }
        };

        const trackButton = document.createElement('button');
        trackButton.textContent = 'Track';
        trackButton.style.cssText = `
            padding: 10px 20px;
            background-color: var(--brand-experiment);
            color: white;
            border: none;
            border-radius: 4px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: opacity 0.1s;
        `;
        trackButton.onmouseover = () => {
            trackButton.style.opacity = '0.85';
        };
        trackButton.onmouseout = () => {
            trackButton.style.opacity = '1';
        };
        trackButton.onclick = () => this.handleTrackMessageFromLink(input.value, content);

        const helpText = document.createElement('div');
        helpText.style.cssText = `
            color: var(--text-muted);
            font-size: 12px;
            line-height: 1.5;
        `;
        helpText.innerHTML = `
            Right-click a message and select "Copy Message Link",<br>
            then paste it here to track the message.
        `;

        const orDivider = document.createElement('div');
        orDivider.style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
            margin: 15px 0;
        `;
        
        const dividerLine1 = document.createElement('div');
        dividerLine1.style.cssText = `
            flex: 1;
            height: 1px;
            background-color: var(--background-modifier-accent);
        `;
        
        const orText = document.createElement('span');
        orText.textContent = 'OR';
        orText.style.cssText = `
            color: var(--text-muted);
            font-size: 12px;
            font-weight: 600;
        `;
        
        const dividerLine2 = document.createElement('div');
        dividerLine2.style.cssText = `
            flex: 1;
            height: 1px;
            background-color: var(--background-modifier-accent);
        `;
        
        orDivider.appendChild(dividerLine1);
        orDivider.appendChild(orText);
        orDivider.appendChild(dividerLine2);

        const selectButton = document.createElement('button');
        selectButton.innerHTML = '🎯 Select Message to Track';
        selectButton.style.cssText = `
            width: 100%;
            padding: 12px;
            background-color: var(--button-secondary-background);
            color: var(--text-normal);
            border: 1px solid var(--button-outline-primary-border);
            border-radius: 4px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.1s;
        `;
        selectButton.onmouseover = () => {
            selectButton.style.backgroundColor = 'var(--button-secondary-background-hover)';
            selectButton.style.borderColor = 'var(--brand-experiment)';
        };
        selectButton.onmouseout = () => {
            selectButton.style.backgroundColor = 'var(--button-secondary-background)';
            selectButton.style.borderColor = 'var(--button-outline-primary-border)';
        };
        selectButton.onclick = () => {
            this.closeSidebar();
            this.enterSelectionMode();
        };

        const selectHelpText = document.createElement('div');
        selectHelpText.style.cssText = `
            color: var(--text-muted);
            font-size: 12px;
            line-height: 1.5;
            text-align: center;
        `;
        selectHelpText.innerHTML = `
            Click this button, then click any message in the channel to track it.
        `;

        inputContainer.appendChild(input);
        inputContainer.appendChild(trackButton);
        inputSection.appendChild(inputLabel);
        inputSection.appendChild(inputContainer);
        inputSection.appendChild(helpText);
        inputSection.appendChild(orDivider);
        inputSection.appendChild(selectButton);
        inputSection.appendChild(selectHelpText);

        // Create tracked messages section
        const trackedSection = document.createElement('div');
        trackedSection.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;

        const trackedTitle = document.createElement('h3');
        trackedTitle.style.cssText = `
            margin: 0;
            color: var(--header-primary);
            font-size: 14px;
            font-weight: 600;
        `;
        trackedTitle.textContent = 'Tracked Messages:';

        const trackedList = document.createElement('div');
        trackedList.id = 'tracked-messages-list';
        trackedList.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;

        this.renderTrackedMessages(trackedList);

        trackedSection.appendChild(trackedTitle);
        trackedSection.appendChild(trackedList);

        // Add sections to content
        content.appendChild(inputSection);
        content.appendChild(trackedSection);

        // Create footer with instructions
        const footer = document.createElement('div');
        footer.style.cssText = `
            padding: 15px 20px;
            border-top: 1px solid var(--background-modifier-accent);
            background-color: var(--background-secondary);
            font-size: 12px;
            color: var(--text-muted);
            line-height: 1.5;
        `;
        footer.innerHTML = `
            <strong style="color: var(--header-secondary);">💡 How it works:</strong><br>
            Click "Select Message to Track" and then click any message in the channel, or paste a Discord message link above to track it. If the message gets deleted,
            it will be automatically resent. Press <kbd style="background: var(--background-modifier-accent); padding: 2px 6px; border-radius: 3px; font-family: monospace;">Ctrl+Shift+T</kbd> to toggle this sidebar.
        `;

        // Assemble sidebar
        sidebar.appendChild(header);
        sidebar.appendChild(content);
        sidebar.appendChild(footer);

        // Close on backdrop click
        backdrop.onclick = (e) => {
            if (e.target === backdrop) {
                this.closeSidebar();
            }
        };

        // Close on Escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeSidebar();
            }
        };
        document.addEventListener('keydown', escapeHandler);

        // Store references
        backdrop.sidebar = sidebar;
        backdrop.escapeHandler = escapeHandler;

        // Add to DOM
        document.body.appendChild(backdrop);
        document.body.appendChild(sidebar);
        this.sidebarElement = { backdrop, sidebar };
    }

    closeSidebar() {
        if (this.sidebarElement) {
            const { backdrop, sidebar } = this.sidebarElement;
            
            if (backdrop.escapeHandler) {
                document.removeEventListener('keydown', backdrop.escapeHandler);
            }
            
            backdrop.remove();
            sidebar.remove();
            this.sidebarElement = null;
        }
    }

    renderTrackedMessages(container) {
        container.innerHTML = '';

        const ChannelStore = BdApi.Webpack.getModule(
            m => m?.getChannel && m?.hasChannel
        );

        if (this.trackedMessages.size === 0) {
            const emptyState = document.createElement('div');
            emptyState.style.cssText = `
                padding: 20px;
                text-align: center;
                color: var(--text-muted);
                font-style: italic;
                background-color: var(--background-secondary);
                border-radius: 6px;
            `;
            emptyState.textContent = 'No messages are currently tracked.';
            container.appendChild(emptyState);
            return;
        }

        this.trackedMessages.forEach((messageData, messageId) => {
            const item = document.createElement('div');
            item.style.cssText = `
                padding: 12px;
                background-color: var(--background-secondary);
                border-radius: 6px;
                border: 1px solid var(--background-modifier-accent);
            `;

            const contentPreview = document.createElement('div');
            contentPreview.style.cssText = `
                color: var(--text-normal);
                font-size: 13px;
                margin-bottom: 8px;
                word-wrap: break-word;
            `;
            const previewText = messageData.content || '[No text content]';
            contentPreview.textContent = previewText.substring(0, 100) + (previewText.length > 100 ? '...' : '');

            const metadata = document.createElement('div');
            metadata.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 11px;
                color: var(--text-muted);
                margin-bottom: 8px;
            `;

            const channel = ChannelStore ? ChannelStore.getChannel(messageData.channelId) : null;
            const channelName = channel ? `#${channel.name}` : 'Unknown Channel';
            
            const metaText = document.createElement('span');
            metaText.textContent = `${channelName} • ${messageData.author.username}`;
            
            metadata.appendChild(metaText);

            const removeBtn = document.createElement('button');
            removeBtn.textContent = 'Untrack';
            removeBtn.style.cssText = `
                padding: 6px 12px;
                background-color: var(--button-danger-background);
                color: white;
                border: none;
                border-radius: 3px;
                font-size: 12px;
                cursor: pointer;
                transition: opacity 0.1s;
            `;
            removeBtn.onmouseover = () => {
                removeBtn.style.opacity = '0.85';
            };
            removeBtn.onmouseout = () => {
                removeBtn.style.opacity = '1';
            };
            removeBtn.onclick = () => {
                this.untrackMessage(messageId);
                BdApi.UI.showToast("Message untracked", { type: "info" });
                this.refreshTrackedMessages();
            };

            item.appendChild(contentPreview);
            item.appendChild(metadata);
            item.appendChild(removeBtn);
            container.appendChild(item);
        });
    }

    refreshTrackedMessages() {
        if (this.sidebarElement) {
            const container = document.getElementById('tracked-messages-list');
            if (container) {
                this.renderTrackedMessages(container);
            }
        }
    }

    parseMessageLink(link) {
        try {
            const url = new URL(link.trim());
            
            if (url.hostname !== 'discord.com' && url.hostname !== 'discordapp.com') {
                return null;
            }

            const pathParts = url.pathname.split('/').filter(p => p);
            
            if (pathParts[0] !== 'channels') {
                return null;
            }

            if (pathParts.length < 4) {
                return null;
            }

            const guildId = pathParts[1];
            const channelId = pathParts[2];
            const messageId = pathParts[3];

            return { guildId, channelId, messageId };
        } catch (error) {
            console.error('[StickyMessageAutoResend] Error parsing message link:', error);
            return null;
        }
    }

    async handleTrackMessageFromLink(link, contentContainer) {
        if (!link || link.trim() === '') {
            BdApi.UI.showToast("Please enter a message link", { type: "error" });
            return;
        }

        const parsed = this.parseMessageLink(link);
        if (!parsed) {
            BdApi.UI.showToast("Invalid message link. Right-click a message and select 'Copy Message Link'.", { type: "error" });
            return;
        }

        const { channelId, messageId } = parsed;

        if (this.trackedMessages.has(messageId)) {
            BdApi.UI.showToast("This message is already being tracked", { type: "info" });
            return;
        }

        try {
            const MessageStore = BdApi.Webpack.getModule(
                m => m?.getMessage && m?.getMessages
            );

            if (!MessageStore) {
                BdApi.UI.showToast("Cannot fetch message: MessageStore not found", { type: "error" });
                return;
            }

            const message = MessageStore.getMessage(channelId, messageId);

            if (!message) {
                BdApi.UI.showToast("Message not found. Make sure you have access to the channel.", { type: "error" });
                return;
            }

            this.trackMessage(message);
            BdApi.UI.showToast("Message is now being tracked!", { type: "success" });
            
            const input = contentContainer.querySelector('input');
            if (input) {
                input.value = '';
            }

            this.refreshTrackedMessages();
        } catch (error) {
            console.error('[StickyMessageAutoResend] Error tracking message from link:', error);
            BdApi.UI.showToast("Failed to track message. Check console for details.", { type: "error" });
        }
    }
    enterSelectionMode() {
        if (this.selectionModeActive) {
            return;
        }

        this.selectionModeActive = true;

        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 999;
            pointer-events: none;
            background-color: rgba(114, 137, 218, 0.1);
            animation: fadeIn 0.2s ease-out;
        `;

        const instructions = document.createElement('div');
        instructions.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: var(--background-floating);
            padding: 20px 30px;
            border-radius: 8px;
            box-shadow: var(--elevation-high);
            text-align: center;
            z-index: 1000;
            pointer-events: none;
            animation: fadeIn 0.3s ease-out;
        `;
        instructions.innerHTML = `
            <div style="color: var(--header-primary); font-size: 16px; font-weight: 600; margin-bottom: 8px;">
                🎯 Click a message to track it
            </div>
            <div style="color: var(--text-muted); font-size: 13px;">
                Press <kbd style="background: var(--background-modifier-accent); padding: 2px 6px; border-radius: 3px; font-family: monospace;">Escape</kbd> to cancel
            </div>
        `;

        overlay.appendChild(instructions);
        document.body.appendChild(overlay);
        this.selectionOverlay = overlay;

        this.messageClickHandler = (event) => {
            const messageElement = event.target.closest('[class*="message-"]');
            if (messageElement) {
                this.handleMessageClick(messageElement);
            }
        };

        const chatContainer = document.querySelector('[class*="messagesWrapper-"]') || 
                            document.querySelector('[class*="chatContent-"]') ||
                            document.querySelector('[data-list-id^="chat-messages"]');
        
        if (chatContainer) {
            chatContainer.style.cursor = 'pointer';
            chatContainer.addEventListener('click', this.messageClickHandler, true);
        }

        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.exitSelectionMode();
            }
        };
        document.addEventListener('keydown', escapeHandler);
        
        if (this.selectionOverlay) {
            this.selectionOverlay.escapeHandler = escapeHandler;
        }

        BdApi.UI.showToast("Click on any message to track it", { type: "info" });
    }

    exitSelectionMode() {
        if (!this.selectionModeActive) {
            return;
        }

        this.selectionModeActive = false;

        if (this.selectionOverlay) {
            if (this.selectionOverlay.escapeHandler) {
                document.removeEventListener('keydown', this.selectionOverlay.escapeHandler);
            }
            this.selectionOverlay.remove();
            this.selectionOverlay = null;
        }

        if (this.messageClickHandler) {
            const chatContainer = document.querySelector('[class*="messagesWrapper-"]') || 
                                document.querySelector('[class*="chatContent-"]') ||
                                document.querySelector('[data-list-id^="chat-messages"]');
            
            if (chatContainer) {
                chatContainer.style.cursor = '';
                chatContainer.removeEventListener('click', this.messageClickHandler, true);
            }
            this.messageClickHandler = null;
        }
    }

    handleMessageClick(messageElement) {
        try {
            const reactInstance = this.getReactInstance(messageElement);
            if (!reactInstance) {
                BdApi.UI.showToast("Could not access message data", { type: "error" });
                this.exitSelectionMode();
                return;
            }

            const messageProps = this.findMessageProps(reactInstance);
            if (!messageProps || !messageProps.message) {
                BdApi.UI.showToast("Could not find message information", { type: "error" });
                this.exitSelectionMode();
                return;
            }

            const message = messageProps.message;
            
            if (this.trackedMessages.has(message.id)) {
                BdApi.UI.showToast("This message is already being tracked", { type: "info" });
                this.exitSelectionMode();
                return;
            }

            this.trackMessage(message);
            BdApi.UI.showToast("Message is now being tracked!", { type: "success" });
            this.exitSelectionMode();
            this.refreshTrackedMessages();
        } catch (error) {
            console.error('[StickyMessageAutoResend] Error handling message click:', error);
            BdApi.UI.showToast("Failed to track message. Check console for details.", { type: "error" });
            this.exitSelectionMode();
        }
    }

    getReactInstance(element) {
        if (!element) return null;
        
        for (const key in element) {
            if (key.startsWith('__reactInternalInstance$') || key.startsWith('__reactFiber$')) {
                return element[key];
            }
        }
        return null;
    }

    findMessageProps(fiber) {
        if (!fiber) return null;
        
        let current = fiber;
        let depth = 0;
        const maxDepth = 30;

        while (current && depth < maxDepth) {
            if (current.memoizedProps?.message) {
                return current.memoizedProps;
            }
            
            if (current.return) {
                current = current.return;
            } else if (current.child) {
                current = current.child;
            } else {
                break;
            }
            depth++;
        }

        return null;
    }
};
