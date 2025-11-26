/**
 * @name StickyMessageAutoResend
 * @author BetterDiscord Community
 * @description Track ONE message by entering its ID in settings. The message will automatically resend when deleted.
 * @version 4.0.0
 * @authorId 0
 * @website https://github.com
 * @source https://github.com
 */

module.exports = class StickyMessageAutoResend {
    constructor() {
        this.trackedMessage = null;
        this.messageDeleteHandler = null;
    }

    getName() { return "StickyMessageAutoResend"; }
    getAuthor() { return "BetterDiscord Community"; }
    getDescription() { return "Track ONE message by entering its ID in settings. The message will automatically resend when deleted."; }
    getVersion() { return "4.0.0"; }

    start() {
        console.log("[StickyMessageAutoResend] Starting plugin...");
        this.loadTrackedMessage();
        this.startMessageDeleteListener();
        BdApi.UI.showToast("StickyMessageAutoResend started! Enter a message ID in settings to track it.", { type: "success" });
    }

    stop() {
        console.log("[StickyMessageAutoResend] Stopping plugin...");
        this.stopMessageDeleteListener();
        BdApi.UI.showToast("StickyMessageAutoResend stopped!", { type: "info" });
    }

    loadTrackedMessage() {
        const saved = BdApi.Data.load(this.getName(), "trackedMessage");
        if (saved) {
            try {
                this.trackedMessage = JSON.parse(saved);
                console.log("[StickyMessageAutoResend] Loaded tracked message:", this.trackedMessage.id);
            } catch (e) {
                console.error("[StickyMessageAutoResend] Failed to load tracked message:", e);
                this.trackedMessage = null;
            }
        }
    }

    saveTrackedMessage() {
        if (this.trackedMessage) {
            BdApi.Data.save(this.getName(), "trackedMessage", JSON.stringify(this.trackedMessage));
        } else {
            BdApi.Data.delete(this.getName(), "trackedMessage");
        }
    }

    async trackMessageById(messageId, channelId) {
        try {
            const MessageStore = BdApi.Webpack.getModule(m => m?.getMessage && m?.getMessages);
            const ChannelStore = BdApi.Webpack.getModule(m => m?.getChannel && m?.getSelectedChannelId);
            
            if (!MessageStore || !ChannelStore) {
                console.error("[StickyMessageAutoResend] Required stores not found");
                BdApi.UI.showToast("Failed to track message: Discord stores not found", { type: "error" });
                return false;
            }

            // Use selected channel if no channelId provided
            const targetChannelId = channelId || ChannelStore.getSelectedChannelId();
            if (!targetChannelId) {
                BdApi.UI.showToast("Please open a channel first", { type: "error" });
                return false;
            }

            const message = MessageStore.getMessage(targetChannelId, messageId);
            
            if (!message) {
                console.error("[StickyMessageAutoResend] Message not found:", messageId);
                BdApi.UI.showToast("Message not found. Make sure the ID is correct and you're in the right channel.", { type: "error" });
                return false;
            }

            this.trackedMessage = {
                id: message.id,
                channelId: message.channel_id,
                content: message.content || "",
                timestamp: message.timestamp
            };
            
            this.saveTrackedMessage();
            console.log("[StickyMessageAutoResend] Now tracking message:", this.trackedMessage.id);
            BdApi.UI.showToast("Message tracked! It will auto-resend if deleted.", { type: "success" });
            return true;

        } catch (error) {
            console.error("[StickyMessageAutoResend] Error tracking message:", error);
            BdApi.UI.showToast("Failed to track message. Check console for details.", { type: "error" });
            return false;
        }
    }

    untrackMessage() {
        this.trackedMessage = null;
        this.saveTrackedMessage();
        console.log("[StickyMessageAutoResend] Stopped tracking message");
        BdApi.UI.showToast("Message untracked.", { type: "info" });
    }

    startMessageDeleteListener() {
        const Dispatcher = BdApi.Webpack.getModule(m => m?.subscribe && m?.dispatch);
        
        if (!Dispatcher) {
            console.error("[StickyMessageAutoResend] Could not find Dispatcher module");
            BdApi.UI.showToast("Failed to start: Dispatcher not found", { type: "error" });
            return;
        }

        this.messageDeleteHandler = (event) => {
            if (event.type === "MESSAGE_DELETE") {
                this.handleMessageDelete(event);
            }
        };
        
        Dispatcher.subscribe("MESSAGE_DELETE", this.messageDeleteHandler);
        console.log("[StickyMessageAutoResend] Message delete listener started");
    }

    stopMessageDeleteListener() {
        if (this.messageDeleteHandler) {
            const Dispatcher = BdApi.Webpack.getModule(m => m?.subscribe && m?.dispatch);
            if (Dispatcher) {
                Dispatcher.unsubscribe("MESSAGE_DELETE", this.messageDeleteHandler);
            }
            this.messageDeleteHandler = null;
            console.log("[StickyMessageAutoResend] Message delete listener stopped");
        }
    }

    handleMessageDelete(event) {
        if (!this.trackedMessage) return;
        
        if (event.id === this.trackedMessage.id) {
            console.log("[StickyMessageAutoResend] Tracked message deleted, resending...");
            setTimeout(() => {
                this.resendMessage();
            }, 500);
        }
    }

    async resendMessage() {
        if (!this.trackedMessage) return;

        try {
            const MessageActions = BdApi.Webpack.getModule(m => m?.sendMessage && m?.receiveMessage);
            
            if (!MessageActions) {
                console.error("[StickyMessageAutoResend] MessageActions not found");
                BdApi.UI.showToast("Failed to resend: MessageActions not found", { type: "error" });
                return;
            }

            const messagePayload = {
                content: this.trackedMessage.content,
                tts: false,
                invalidEmojis: [],
                validNonShortcutEmojis: []
            };

            await MessageActions.sendMessage(this.trackedMessage.channelId, messagePayload);
            
            console.log("[StickyMessageAutoResend] Message resent successfully");
            BdApi.UI.showToast("Tracked message resent!", { type: "success" });
            
            // Update tracked message ID after resend
            setTimeout(() => {
                this.updateTrackedMessageId();
            }, 1000);

        } catch (error) {
            console.error("[StickyMessageAutoResend] Failed to resend message:", error);
            BdApi.UI.showToast("Failed to resend message. Check console.", { type: "error" });
        }
    }

    async updateTrackedMessageId() {
        try {
            const MessageStore = BdApi.Webpack.getModule(m => m?.getMessage && m?.getMessages);
            
            if (!MessageStore) {
                console.warn("[StickyMessageAutoResend] Could not find MessageStore to update message ID");
                return;
            }

            const messages = MessageStore.getMessages(this.trackedMessage.channelId);
            if (!messages) return;

            // Find the most recent message with matching content
            const messageArray = messages._array || [];
            for (let i = messageArray.length - 1; i >= 0; i--) {
                const msg = messageArray[i];
                if (msg.content === this.trackedMessage.content) {
                    const oldId = this.trackedMessage.id;
                    this.trackedMessage.id = msg.id;
                    this.trackedMessage.timestamp = msg.timestamp;
                    this.saveTrackedMessage();
                    console.log("[StickyMessageAutoResend] Updated tracked message ID from", oldId, "to", msg.id);
                    break;
                }
            }
        } catch (error) {
            console.error("[StickyMessageAutoResend] Error updating message ID:", error);
        }
    }

    getSettingsPanel() {
        const panel = document.createElement("div");
        panel.style.padding = "20px";
        panel.style.color = "var(--text-normal)";
        
        const title = document.createElement("h2");
        title.textContent = "Sticky Message Auto-Resend";
        title.style.marginBottom = "15px";
        panel.appendChild(title);

        const instructions = document.createElement("div");
        instructions.style.marginBottom = "20px";
        instructions.style.padding = "15px";
        instructions.style.backgroundColor = "var(--background-secondary)";
        instructions.style.borderRadius = "5px";
        instructions.innerHTML = `
            <h3 style="margin-top: 0; margin-bottom: 10px;">How to use:</h3>
            <ol style="margin: 0; padding-left: 20px; line-height: 1.8;">
                <li>Right-click on a message and select "Copy Message ID" (requires Developer Mode enabled)</li>
                <li>Paste the message ID into the input field below</li>
                <li>Click "Track Message" to start tracking it</li>
                <li>The message will automatically resend if deleted</li>
            </ol>
            <p style="margin-top: 15px; margin-bottom: 0; color: var(--text-muted); font-size: 14px;">
                <strong>Note:</strong> Only ONE message can be tracked at a time. Enable Developer Mode in Discord Settings > Advanced if you don't see the "Copy Message ID" option.
            </p>
        `;
        panel.appendChild(instructions);

        // Track Message Section (only show if not currently tracking)
        if (!this.trackedMessage) {
            const trackSection = document.createElement("div");
            trackSection.style.marginBottom = "20px";
            trackSection.style.padding = "15px";
            trackSection.style.backgroundColor = "var(--background-secondary)";
            trackSection.style.borderRadius = "5px";
            
            const trackTitle = document.createElement("h3");
            trackTitle.textContent = "Track a Message:";
            trackTitle.style.marginTop = "0";
            trackTitle.style.marginBottom = "10px";
            trackSection.appendChild(trackTitle);

            const inputLabel = document.createElement("label");
            inputLabel.textContent = "Message ID:";
            inputLabel.style.display = "block";
            inputLabel.style.marginBottom = "8px";
            inputLabel.style.fontWeight = "500";
            trackSection.appendChild(inputLabel);

            const input = document.createElement("input");
            input.type = "text";
            input.placeholder = "Paste message ID here (e.g., 1234567890123456789)";
            input.style.cssText = `
                width: 100%;
                padding: 10px;
                background-color: var(--input-background);
                border: 1px solid var(--background-tertiary);
                border-radius: 4px;
                color: var(--text-normal);
                font-size: 14px;
                box-sizing: border-box;
                margin-bottom: 10px;
            `;
            trackSection.appendChild(input);

            const trackBtn = document.createElement("button");
            trackBtn.textContent = "Track Message";
            trackBtn.style.cssText = `
                padding: 10px 20px;
                background-color: var(--brand-experiment);
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
            `;
            trackBtn.onclick = async () => {
                const messageId = input.value.trim();
                if (!messageId) {
                    BdApi.UI.showToast("Please enter a message ID", { type: "error" });
                    return;
                }

                const success = await this.trackMessageById(messageId);
                if (success) {
                    // Refresh the settings panel
                    const settingsContainer = panel.parentElement;
                    if (settingsContainer) {
                        const newPanel = this.getSettingsPanel();
                        settingsContainer.innerHTML = '';
                        settingsContainer.appendChild(newPanel);
                    }
                }
            };
            trackSection.appendChild(trackBtn);

            panel.appendChild(trackSection);
        }

        // Status Section
        const statusSection = document.createElement("div");
        statusSection.style.padding = "15px";
        statusSection.style.backgroundColor = "var(--background-secondary)";
        statusSection.style.borderRadius = "5px";
        
        const statusTitle = document.createElement("h3");
        statusTitle.textContent = "Current Status:";
        statusTitle.style.marginTop = "0";
        statusTitle.style.marginBottom = "10px";
        statusSection.appendChild(statusTitle);

        if (this.trackedMessage) {
            const ChannelStore = BdApi.Webpack.getModule(m => m?.getChannel && m?.hasChannel);
            const channel = ChannelStore ? ChannelStore.getChannel(this.trackedMessage.channelId) : null;
            const channelName = channel ? `#${channel.name}` : "Unknown Channel";

            const info = document.createElement("div");
            info.innerHTML = `
                <p style="margin: 0 0 10px 0;"><strong>Status:</strong> <span style="color: var(--status-positive);">✓ Tracking a message</span></p>
                <p style="margin: 0 0 10px 0;"><strong>Channel:</strong> ${channelName}</p>
                <p style="margin: 0 0 10px 0;"><strong>Content:</strong> ${this.trackedMessage.content.substring(0, 100)}${this.trackedMessage.content.length > 100 ? '...' : ''}</p>
                <p style="margin: 0 0 15px 0;"><strong>Message ID:</strong> ${this.trackedMessage.id}</p>
            `;
            statusSection.appendChild(info);

            const untrackBtn = document.createElement("button");
            untrackBtn.textContent = "Untrack Message";
            untrackBtn.style.cssText = `
                padding: 10px 20px;
                background-color: var(--button-danger-background);
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
            `;
            untrackBtn.onclick = () => {
                this.untrackMessage();
                // Refresh the settings panel
                const settingsContainer = panel.parentElement;
                if (settingsContainer) {
                    const newPanel = this.getSettingsPanel();
                    settingsContainer.innerHTML = '';
                    settingsContainer.appendChild(newPanel);
                }
            };
            statusSection.appendChild(untrackBtn);
        } else {
            const noTracking = document.createElement("p");
            noTracking.textContent = "No message is currently being tracked.";
            noTracking.style.color = "var(--text-muted)";
            noTracking.style.fontStyle = "italic";
            noTracking.style.margin = "0";
            statusSection.appendChild(noTracking);
        }

        panel.appendChild(statusSection);

        return panel;
    }
};
