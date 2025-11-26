/**
 * @name StickyMessageAutoResend
 * @author BetterDiscord Community
 * @description Automatically resends a tracked message if it gets deleted. Press Ctrl+Shift+T to open tracking menu.
 * @version 2.1.0
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
        this.modalElement = null;
    }

    getName() { return "StickyMessageAutoResend"; }
    getAuthor() { return "BetterDiscord Community"; }
    getDescription() { return "Automatically resends a tracked message if it gets deleted. Press Ctrl+Shift+T to open tracking menu."; }
    getVersion() { return "2.1.0"; }

    start() {
        this.loadSettings();
        this.patchContextMenu();
        this.startMessageDeleteListener();
        this.registerKeyboardShortcut();
        BdApi.UI.showToast("StickyMessageAutoResend has started! Press Ctrl+Shift+T to open tracking menu.", { type: "success" });
    }

    stop() {
        this.stopMessageDeleteListener();
        this.unregisterKeyboardShortcut();
        this.closeModal();
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
                <li style="margin-bottom: 5px;"><strong>Recommended:</strong> Press <kbd style="background: var(--background-modifier-accent); padding: 2px 6px; border-radius: 3px; font-family: monospace;">Ctrl+Shift+T</kbd> to open the tracking menu</li>
                <li style="margin-bottom: 5px;">Or right-click on any message and select "Track Message (Auto-Resend)"</li>
                <li style="margin-bottom: 5px;">The message will automatically be resent if deleted</li>
                <li>To stop tracking, use the pop-up menu, right-click the message, or use this panel</li>
            </ol>
        `;
        panel.appendChild(instructions);

        return panel;
    }

    registerKeyboardShortcut() {
        this.keyboardHandler = (event) => {
            // Ctrl+Shift+T to open the tracking modal
            if (event.ctrlKey && event.shiftKey && event.key === 'T') {
                event.preventDefault();
                event.stopPropagation();
                this.openModal();
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

    openModal() {
        // Close existing modal if open
        if (this.modalElement) {
            this.closeModal();
        }

        // Get current channel
        const SelectedChannelStore = BdApi.Webpack.getModule(
            m => m?.getChannelId && m?.getVoiceChannelId
        );
        
        if (!SelectedChannelStore) {
            BdApi.UI.showToast("Cannot open tracking menu: SelectedChannelStore not found", { type: "error" });
            return;
        }

        const currentChannelId = SelectedChannelStore.getChannelId();
        
        if (!currentChannelId) {
            BdApi.UI.showToast("Please select a channel first", { type: "info" });
            return;
        }

        // Get messages from current channel
        const MessageStore = BdApi.Webpack.getModule(
            m => m?.getMessages && m?.getMessage
        );
        
        if (!MessageStore) {
            BdApi.UI.showToast("Cannot open tracking menu: MessageStore not found", { type: "error" });
            return;
        }

        const messages = MessageStore.getMessages(currentChannelId);
        
        if (!messages || !messages._array || messages._array.length === 0) {
            BdApi.UI.showToast("No messages found in this channel", { type: "info" });
            return;
        }

        this.renderModal(currentChannelId, messages._array);
    }

    renderModal(channelId, messages) {
        // Get stores for user and channel info
        const UserStore = BdApi.Webpack.getModule(
            m => m?.getCurrentUser && m?.getUser
        );
        
        const ChannelStore = BdApi.Webpack.getModule(
            m => m?.getChannel && m?.hasChannel
        );

        const currentUser = UserStore ? UserStore.getCurrentUser() : null;
        const channel = ChannelStore ? ChannelStore.getChannel(channelId) : null;
        const channelName = channel ? `#${channel.name}` : "Unknown Channel";

        // Create modal backdrop
        const backdrop = document.createElement('div');
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.85);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.15s ease-out;
        `;

        // Create modal container
        const modal = document.createElement('div');
        modal.style.cssText = `
            background-color: var(--background-primary);
            border-radius: 8px;
            width: 90%;
            max-width: 700px;
            max-height: 80vh;
            display: flex;
            flex-direction: column;
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
            animation: slideIn 0.2s ease-out;
        `;

        // Add animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideIn {
                from { transform: translateY(-20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
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
        `;

        const title = document.createElement('h2');
        title.style.cssText = `
            margin: 0;
            color: var(--header-primary);
            font-size: 20px;
            font-weight: 600;
        `;
        title.textContent = `Track Messages in ${channelName}`;

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
        closeButton.onclick = () => this.closeModal();

        header.appendChild(title);
        header.appendChild(closeButton);

        // Create scrollable content area
        const content = document.createElement('div');
        content.style.cssText = `
            padding: 20px;
            overflow-y: auto;
            flex: 1;
        `;

        // Filter and display messages (only show recent messages)
        const recentMessages = messages.slice(-50).reverse();

        if (recentMessages.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.style.cssText = `
                text-align: center;
                color: var(--text-muted);
                padding: 40px 20px;
                font-style: italic;
            `;
            emptyState.textContent = 'No messages found in this channel';
            content.appendChild(emptyState);
        } else {
            const messageList = document.createElement('div');
            messageList.style.cssText = `
                display: flex;
                flex-direction: column;
                gap: 10px;
            `;

            recentMessages.forEach(message => {
                const isTracked = this.trackedMessages.has(message.id);
                const isOwnMessage = currentUser && message.author.id === currentUser.id;

                const messageItem = document.createElement('div');
                messageItem.style.cssText = `
                    padding: 12px;
                    background-color: ${isTracked ? 'var(--background-modifier-selected)' : 'var(--background-secondary)'};
                    border-radius: 6px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 12px;
                    border: 2px solid ${isTracked ? 'var(--brand-experiment)' : 'transparent'};
                    transition: background-color 0.1s;
                `;

                const messageInfo = document.createElement('div');
                messageInfo.style.cssText = `
                    flex: 1;
                    min-width: 0;
                `;

                // Author and timestamp
                const authorLine = document.createElement('div');
                authorLine.style.cssText = `
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 6px;
                `;

                const authorName = document.createElement('span');
                authorName.style.cssText = `
                    color: var(--header-primary);
                    font-weight: 600;
                    font-size: 14px;
                `;
                authorName.textContent = message.author.username;

                const timestamp = document.createElement('span');
                timestamp.style.cssText = `
                    color: var(--text-muted);
                    font-size: 12px;
                `;
                const date = new Date(message.timestamp);
                timestamp.textContent = date.toLocaleString();

                if (isOwnMessage) {
                    const badge = document.createElement('span');
                    badge.style.cssText = `
                        background-color: var(--brand-experiment);
                        color: white;
                        font-size: 10px;
                        padding: 2px 6px;
                        border-radius: 3px;
                        font-weight: 600;
                    `;
                    badge.textContent = 'YOU';
                    authorLine.appendChild(badge);
                }

                authorLine.appendChild(authorName);
                authorLine.appendChild(timestamp);

                // Message content preview
                const contentPreview = document.createElement('div');
                contentPreview.style.cssText = `
                    color: var(--text-normal);
                    font-size: 14px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    line-height: 1.4;
                `;
                const previewText = message.content || '[No text content]';
                contentPreview.textContent = previewText.substring(0, 150) + (previewText.length > 150 ? '...' : '');

                messageInfo.appendChild(authorLine);
                messageInfo.appendChild(contentPreview);

                // Track/Untrack button
                const actionButton = document.createElement('button');
                actionButton.style.cssText = `
                    padding: 8px 16px;
                    border: none;
                    border-radius: 4px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    white-space: nowrap;
                    transition: background-color 0.1s, opacity 0.1s;
                    background-color: ${isTracked ? 'var(--button-danger-background)' : 'var(--brand-experiment)'};
                    color: white;
                `;
                actionButton.textContent = isTracked ? 'Untrack' : 'Track';

                actionButton.onmouseover = () => {
                    actionButton.style.opacity = '0.85';
                };
                actionButton.onmouseout = () => {
                    actionButton.style.opacity = '1';
                };

                actionButton.onclick = () => {
                    if (isTracked) {
                        this.untrackMessage(message.id);
                        BdApi.UI.showToast("Message untracked", { type: "info" });
                        messageItem.style.backgroundColor = 'var(--background-secondary)';
                        messageItem.style.borderColor = 'transparent';
                        actionButton.textContent = 'Track';
                        actionButton.style.backgroundColor = 'var(--brand-experiment)';
                    } else {
                        this.trackMessage(message);
                        BdApi.UI.showToast("Message is now being tracked!", { type: "success" });
                        messageItem.style.backgroundColor = 'var(--background-modifier-selected)';
                        messageItem.style.borderColor = 'var(--brand-experiment)';
                        actionButton.textContent = 'Untrack';
                        actionButton.style.backgroundColor = 'var(--button-danger-background)';
                    }
                };

                messageItem.appendChild(messageInfo);
                messageItem.appendChild(actionButton);
                messageList.appendChild(messageItem);
            });

            content.appendChild(messageList);
        }

        // Create footer with instructions
        const footer = document.createElement('div');
        footer.style.cssText = `
            padding: 15px 20px;
            border-top: 1px solid var(--background-modifier-accent);
            background-color: var(--background-secondary);
            border-radius: 0 0 8px 8px;
        `;

        const instructions = document.createElement('div');
        instructions.style.cssText = `
            color: var(--text-muted);
            font-size: 13px;
            line-height: 1.5;
        `;
        instructions.innerHTML = `
            <strong style="color: var(--header-secondary);">💡 Tip:</strong> 
            Click "Track" to monitor a message. If it gets deleted, it will be automatically resent. 
            Press <kbd style="background: var(--background-modifier-accent); padding: 2px 6px; border-radius: 3px; font-family: monospace;">Ctrl+Shift+T</kbd> to reopen this menu or <kbd style="background: var(--background-modifier-accent); padding: 2px 6px; border-radius: 3px; font-family: monospace;">Esc</kbd> to close.
        `;
        footer.appendChild(instructions);

        // Assemble modal
        modal.appendChild(header);
        modal.appendChild(content);
        modal.appendChild(footer);
        backdrop.appendChild(modal);

        // Close on backdrop click
        backdrop.onclick = (e) => {
            if (e.target === backdrop) {
                this.closeModal();
            }
        };

        // Close on Escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        };
        document.addEventListener('keydown', escapeHandler);
        backdrop.escapeHandler = escapeHandler;

        // Add to DOM
        document.body.appendChild(backdrop);
        this.modalElement = backdrop;
    }

    closeModal() {
        if (this.modalElement) {
            // Remove escape handler
            if (this.modalElement.escapeHandler) {
                document.removeEventListener('keydown', this.modalElement.escapeHandler);
            }
            this.modalElement.remove();
            this.modalElement = null;
        }
    }
};
