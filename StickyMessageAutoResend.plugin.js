/**
 * @name StickyMessageAutoResend
 * @author BetterDiscord Community
 * @description Automatically resends a tracked message if it gets deleted
 * @version 2.0.0
 * @authorId 0
 * @website https://github.com
 * @source https://github.com
 */

module.exports = class StickyMessageAutoResend {
    constructor() {
        this.trackedMessages = new Map();
        this.messageDeleteHandler = null;
        this.messageCreateHandler = null;
    }

    getName() { return "StickyMessageAutoResend"; }
    getAuthor() { return "BetterDiscord Community"; }
    getDescription() { return "Automatically resends a tracked message if it gets deleted"; }
    getVersion() { return "2.0.0"; }

    start() {
        this.loadSettings();
        this.patchContextMenu();
        this.startMessageDeleteListener();
        BdApi.UI.showToast("StickyMessageAutoResend has started!", { type: "success" });
    }

    stop() {
        this.stopMessageDeleteListener();
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
                <li style="margin-bottom: 5px;">Right-click on any message you want to track</li>
                <li style="margin-bottom: 5px;">Click "Track Message (Auto-Resend)"</li>
                <li style="margin-bottom: 5px;">The message will automatically be resent if deleted</li>
                <li>To stop tracking, right-click and select "Untrack Message" or use this panel</li>
            </ol>
        `;
        panel.appendChild(instructions);

        return panel;
    }
};
