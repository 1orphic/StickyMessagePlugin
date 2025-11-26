/**
 * @name StickyMessageAutoResend
 * @author BetterDiscord Community
 * @description Track ONE message by entering its ID and Channel ID in settings. The message will automatically resend when deleted.
 * @version 5.1.1
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
    getDescription() { return "Track ONE message by entering its ID and Channel ID in settings. The message will automatically resend when deleted."; }
    getVersion() { return "5.1.1"; }

    start() {
        console.log("[StickyMessageAutoResend] Starting plugin...");
        this.loadTrackedMessage();
        this.startMessageDeleteListener();
        BdApi.UI.showToast("StickyMessageAutoResend started! Enter message details in settings to track it.", { type: "success" });
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

    trackMessage(messageId, channelId, content) {
        try {
            if (!messageId || !messageId.trim()) {
                BdApi.UI.showToast("Please enter a message ID", { type: "error" });
                return false;
            }

            if (!channelId || !channelId.trim()) {
                BdApi.UI.showToast("Please enter a channel ID", { type: "error" });
                return false;
            }

            if (!content || !content.trim()) {
                BdApi.UI.showToast("Please enter the message content", { type: "error" });
                return false;
            }

            this.trackedMessage = {
                id: messageId.trim(),
                channelId: channelId.trim(),
                content: content.trim()
            };
            
            this.saveTrackedMessage();
            console.log("[StickyMessageAutoResend] Now tracking message:", this.trackedMessage.id, "in channel:", this.trackedMessage.channelId);
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

    findDispatcher() {
        // Try multiple patterns to find Dispatcher
        let dispatcher = BdApi.Webpack.getModule(m => m?.subscribe && m?.dispatch);
        if (!dispatcher) {
            // Try alternative pattern
            dispatcher = BdApi.Webpack.getModule(m => m?.subscribe && m?.unsubscribe);
        }
        if (!dispatcher) {
            // Try searching by all dispatch methods
            dispatcher = BdApi.Webpack.getModule(m => typeof m?.subscribe === 'function' && typeof m?.dispatch === 'function');
        }
        if (!dispatcher) {
            // Try using Filters if available
            try {
                if (BdApi.Webpack.Filters) {
                    dispatcher = BdApi.Webpack.getModule(BdApi.Webpack.Filters.byProps("subscribe", "dispatch"));
                }
            } catch (e) {
                console.warn("[StickyMessageAutoResend] Filters API not available:", e);
            }
        }
        return dispatcher;
    }

    startMessageDeleteListener() {
        const Dispatcher = this.findDispatcher();
        
        if (!Dispatcher) {
            console.error("[StickyMessageAutoResend] Could not find Dispatcher module");
            BdApi.UI.showToast("Failed to start: Dispatcher not found. Try reloading Discord.", { type: "error" });
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
            const Dispatcher = this.findDispatcher();
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

    getAuthToken() {
        try {
            const tokenModule = BdApi.Webpack.getModule(m => m?.getToken && typeof m.getToken === 'function');
            if (tokenModule) {
                return tokenModule.getToken();
            }
            
            const altTokenModule = BdApi.Webpack.getModule(m => m?.token);
            if (altTokenModule?.token) {
                return altTokenModule.token;
            }
            
            console.error("[StickyMessageAutoResend] Could not find auth token module");
            return null;
        } catch (error) {
            console.error("[StickyMessageAutoResend] Error getting auth token:", error);
            return null;
        }
    }

    async resendMessage() {
        if (!this.trackedMessage) return;

        try {
            console.log("[StickyMessageAutoResend] Resending via REST API...");
            
            const token = this.getAuthToken();
            if (!token) {
                console.error("[StickyMessageAutoResend] No auth token available");
                BdApi.UI.showToast("Failed to resend: No authentication token found", { type: "error" });
                return;
            }
            
            const endpoint = `https://discord.com/api/v9/channels/${this.trackedMessage.channelId}/messages`;
            
            console.log("[StickyMessageAutoResend] Using BdApi.Net.fetch - NOT Discord internal sendMessage");
            const response = await BdApi.Net.fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": token
                },
                body: JSON.stringify({
                    content: this.trackedMessage.content
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error("[StickyMessageAutoResend] REST API error:", response.status, errorData);
                BdApi.UI.showToast(`Failed to resend: ${response.status} ${response.statusText}`, { type: "error" });
                return;
            }
            
            const responseData = await response.json();
            console.log("[StickyMessageAutoResend] Message resent successfully via REST API to channel:", this.trackedMessage.channelId);
            console.log("[StickyMessageAutoResend] New message ID:", responseData.id);
            BdApi.UI.showToast("Tracked message resent via REST API!", { type: "success" });

        } catch (error) {
            console.error("[StickyMessageAutoResend] Failed to resend message via REST API:", error);
            BdApi.UI.showToast("Failed to resend message. Check console.", { type: "error" });
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
                <li>Enable Developer Mode in Discord Settings > Advanced (if not already enabled)</li>
                <li>Right-click on the message you want to track and select "Copy Message ID"</li>
                <li>Right-click on the channel name and select "Copy Channel ID"</li>
                <li>Copy the message content (text)</li>
                <li>Paste all three values into the fields below and click "Track Message"</li>
                <li>The message will automatically resend if deleted</li>
            </ol>
            <p style="margin-top: 15px; margin-bottom: 0; color: var(--text-muted); font-size: 14px;">
                <strong>Note:</strong> Only ONE message can be tracked at a time.
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
            trackTitle.style.marginBottom = "15px";
            trackSection.appendChild(trackTitle);

            // Message ID Input
            const messageIdLabel = document.createElement("label");
            messageIdLabel.textContent = "Message ID:";
            messageIdLabel.style.display = "block";
            messageIdLabel.style.marginBottom = "8px";
            messageIdLabel.style.fontWeight = "500";
            trackSection.appendChild(messageIdLabel);

            const messageIdInput = document.createElement("input");
            messageIdInput.type = "text";
            messageIdInput.placeholder = "Paste message ID here (e.g., 1234567890123456789)";
            messageIdInput.style.cssText = `
                width: 100%;
                padding: 10px;
                background-color: var(--input-background);
                border: 1px solid var(--background-tertiary);
                border-radius: 4px;
                color: var(--text-normal);
                font-size: 14px;
                box-sizing: border-box;
                margin-bottom: 15px;
            `;
            trackSection.appendChild(messageIdInput);

            // Channel ID Input
            const channelIdLabel = document.createElement("label");
            channelIdLabel.textContent = "Channel ID:";
            channelIdLabel.style.display = "block";
            channelIdLabel.style.marginBottom = "8px";
            channelIdLabel.style.fontWeight = "500";
            trackSection.appendChild(channelIdLabel);

            const channelIdInput = document.createElement("input");
            channelIdInput.type = "text";
            channelIdInput.placeholder = "Paste channel ID here (e.g., 9876543210987654321)";
            channelIdInput.style.cssText = `
                width: 100%;
                padding: 10px;
                background-color: var(--input-background);
                border: 1px solid var(--background-tertiary);
                border-radius: 4px;
                color: var(--text-normal);
                font-size: 14px;
                box-sizing: border-box;
                margin-bottom: 15px;
            `;
            trackSection.appendChild(channelIdInput);

            // Message Content Input
            const contentLabel = document.createElement("label");
            contentLabel.textContent = "Message Content:";
            contentLabel.style.display = "block";
            contentLabel.style.marginBottom = "8px";
            contentLabel.style.fontWeight = "500";
            trackSection.appendChild(contentLabel);

            const contentInput = document.createElement("textarea");
            contentInput.placeholder = "Paste the message content here...";
            contentInput.style.cssText = `
                width: 100%;
                padding: 10px;
                background-color: var(--input-background);
                border: 1px solid var(--background-tertiary);
                border-radius: 4px;
                color: var(--text-normal);
                font-size: 14px;
                box-sizing: border-box;
                margin-bottom: 15px;
                min-height: 100px;
                resize: vertical;
                font-family: inherit;
            `;
            trackSection.appendChild(contentInput);

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
            trackBtn.onclick = () => {
                const messageId = messageIdInput.value.trim();
                const channelId = channelIdInput.value.trim();
                const content = contentInput.value.trim();

                const success = this.trackMessage(messageId, channelId, content);
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
            const info = document.createElement("div");
            info.innerHTML = `
                <p style="margin: 0 0 10px 0;"><strong>Status:</strong> <span style="color: var(--status-positive);">✓ Tracking a message</span></p>
                <p style="margin: 0 0 10px 0;"><strong>Channel ID:</strong> ${this.trackedMessage.channelId}</p>
                <p style="margin: 0 0 10px 0;"><strong>Message ID:</strong> ${this.trackedMessage.id}</p>
                <p style="margin: 0 0 15px 0;"><strong>Content:</strong> ${this.trackedMessage.content.substring(0, 100)}${this.trackedMessage.content.length > 100 ? '...' : ''}</p>
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
