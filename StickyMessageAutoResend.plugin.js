/**
 * @name StickyMessageAutoResend
 * @author BetterDiscord Community
 * @description Automatically resends a tracked message if it gets deleted
 * @version 1.0.0
 * @authorId 0
 * @website https://github.com
 * @source https://github.com
 */

module.exports = (() => {
    const config = {
        info: {
            name: "StickyMessageAutoResend",
            authors: [{
                name: "BetterDiscord Community",
                discord_id: "0",
                github_username: "betterdiscord"
            }],
            version: "1.0.0",
            description: "Automatically resends a tracked message if it gets deleted",
            github: "https://github.com",
            github_raw: "https://raw.githubusercontent.com"
        },
        changelog: [
            {
                title: "Initial Release",
                type: "added",
                items: [
                    "Track specific messages via context menu",
                    "Automatically resend tracked messages when deleted",
                    "Configure tracked messages via settings panel",
                    "Support for multiple tracked messages per channel"
                ]
            }
        ],
        defaultConfig: []
    };

    return !global.ZeresPluginLibrary ? class {
        constructor() { this._config = config; }
        getName() { return config.info.name; }
        getAuthor() { return config.info.authors.map(a => a.name).join(", "); }
        getDescription() { return config.info.description; }
        getVersion() { return config.info.version; }
        load() {
            BdApi.showConfirmationModal("Library Missing", `The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`, {
                confirmText: "Download Now",
                cancelText: "Cancel",
                onConfirm: () => {
                    require("request").get("https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js", async (error, response, body) => {
                        if (error) return require("electron").shell.openExternal("https://betterdiscord.app/Download?id=9");
                        await new Promise(r => require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), body, r));
                    });
                }
            });
        }
        start() { }
        stop() { }
    } : (([Plugin, Api]) => {
        const plugin = (Plugin, Library) => {
            const { WebpackModules, Patcher, ContextMenu, Settings, Toasts, DiscordModules } = Library;
            const { MessageActions, ChannelStore, UserStore } = DiscordModules;

            return class StickyMessageAutoResend extends Plugin {
                constructor() {
                    super();
                    this.trackedMessages = new Map();
                    this.messageDeleteHandler = null;
                }

                onStart() {
                    this.loadSettings();
                    this.patchContextMenu();
                    this.startMessageDeleteListener();
                    Toasts.success(`${this.getName()} has started!`);
                }

                onStop() {
                    this.stopMessageDeleteListener();
                    Patcher.unpatchAll();
                    Toasts.info(`${this.getName()} has stopped!`);
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
                    const MessageContextMenu = WebpackModules.getModule(m => m.default && m.default.displayName === "MessageContextMenu");
                    
                    if (MessageContextMenu) {
                        Patcher.after(MessageContextMenu, "default", (_, [props], returnValue) => {
                            if (!returnValue || !props.message) return;
                            
                            const message = props.message;
                            const isTracked = this.trackedMessages.has(message.id);
                            
                            returnValue.props.children.push(
                                ContextMenu.buildMenuItem({
                                    label: isTracked ? "Untrack Message" : "Track Message (Auto-Resend)",
                                    action: () => {
                                        if (isTracked) {
                                            this.untrackMessage(message.id);
                                            Toasts.info("Message untracked");
                                        } else {
                                            this.trackMessage(message);
                                            Toasts.success("Message is now being tracked!");
                                        }
                                    }
                                })
                            );
                        });
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
                    const Dispatcher = WebpackModules.getByProps("dispatch", "subscribe");
                    
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
                        const Dispatcher = WebpackModules.getByProps("dispatch", "subscribe");
                        if (Dispatcher) {
                            Dispatcher.unsubscribe("MESSAGE_DELETE", this.messageDeleteHandler);
                        }
                        this.messageDeleteHandler = null;
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
                        const channel = ChannelStore.getChannel(messageData.channelId);
                        
                        if (!channel) {
                            Toasts.error("Cannot resend message: Channel not found");
                            return;
                        }

                        const MessageQueue = WebpackModules.getByProps("enqueue");
                        const messagePayload = {
                            channelId: messageData.channelId,
                            content: messageData.content || "",
                            tts: false,
                            invalidEmojis: [],
                            validNonShortcutEmojis: []
                        };

                        if (MessageQueue && MessageQueue.enqueue) {
                            MessageQueue.enqueue({
                                type: 0,
                                message: messagePayload
                            }, () => {});
                        } else if (MessageActions && MessageActions.sendMessage) {
                            MessageActions.sendMessage(messageData.channelId, {
                                content: messageData.content || "",
                                tts: false,
                                invalidEmojis: [],
                                validNonShortcutEmojis: []
                            });
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

                        Toasts.success("Tracked message resent successfully!");
                    } catch (error) {
                        console.error("Failed to resend message:", error);
                        Toasts.error("Failed to resend message. Check console for details.");
                    }
                }

                async waitForNewMessage(channelId, content, timeout = 3000) {
                    return new Promise((resolve) => {
                        let found = false;
                        const startTime = Date.now();
                        
                        const Dispatcher = WebpackModules.getByProps("dispatch", "subscribe");
                        
                        const handler = (event) => {
                            if (event.type === "MESSAGE_CREATE" && event.channelId === channelId) {
                                if (event.message.content === content && event.message.author.id === UserStore.getCurrentUser().id) {
                                    found = true;
                                    Dispatcher.unsubscribe("MESSAGE_CREATE", handler);
                                    resolve(event.message);
                                }
                            }
                        };
                        
                        Dispatcher.subscribe("MESSAGE_CREATE", handler);
                        
                        setTimeout(() => {
                            if (!found) {
                                Dispatcher.unsubscribe("MESSAGE_CREATE", handler);
                                resolve(null);
                            }
                        }, timeout);
                    });
                }

                getSettingsPanel() {
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
                            
                            const channel = ChannelStore.getChannel(messageData.channelId);
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
                                Toasts.info("Message untracked");
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
        };
        return plugin(Plugin, Api);
    })(global.ZeresPluginLibrary.buildPlugin(config));
})();
