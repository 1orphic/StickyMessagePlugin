/**
 * @name StickyMessageAutoResend
 * @author BetterDiscord Community
 * @description Track ONE message and automatically resend it when deleted. Hover over a message and click the 📌 pin button to track it.
 * @version 3.0.0
 * @authorId 0
 * @website https://github.com
 * @source https://github.com
 */

module.exports = class StickyMessageAutoResend {
    constructor() {
        this.trackedMessage = null;
        this.messageDeleteHandler = null;
        this.observerCleanup = null;
    }

    getName() { return "StickyMessageAutoResend"; }
    getAuthor() { return "BetterDiscord Community"; }
    getDescription() { return "Track ONE message and automatically resend it when deleted. Hover over a message and click the 📌 pin button to track it."; }
    getVersion() { return "3.0.0"; }

    start() {
        console.log("[StickyMessageAutoResend] Starting plugin...");
        this.loadTrackedMessage();
        this.startMessageDeleteListener();
        this.injectTrackButtons();
        BdApi.UI.showToast("StickyMessageAutoResend started! Hover over a message and click 📌 to track it.", { type: "success" });
    }

    stop() {
        console.log("[StickyMessageAutoResend] Stopping plugin...");
        this.stopMessageDeleteListener();
        this.removeTrackButtons();
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

    trackMessage(message) {
        this.trackedMessage = {
            id: message.id,
            channelId: message.channel_id,
            content: message.content || "",
            timestamp: message.timestamp
        };
        this.saveTrackedMessage();
        this.updateButtonStates();
        console.log("[StickyMessageAutoResend] Now tracking message:", this.trackedMessage.id);
        BdApi.UI.showToast("Message tracked! It will auto-resend if deleted.", { type: "success" });
    }

    untrackMessage() {
        this.trackedMessage = null;
        this.saveTrackedMessage();
        this.updateButtonStates();
        console.log("[StickyMessageAutoResend] Stopped tracking message");
        BdApi.UI.showToast("Message untracked.", { type: "info" });
    }

    updateButtonStates() {
        // Update all visible track buttons to reflect current tracking state
        document.querySelectorAll('.sticky-track-button').forEach(button => {
            const messageId = button.dataset.messageId;
            const isTracked = this.trackedMessage && this.trackedMessage.id === messageId;
            
            if (isTracked) {
                button.style.backgroundColor = 'var(--brand-experiment)';
                button.style.opacity = '0.8';
                button.title = 'This message is tracked (click to untrack)';
            } else {
                button.style.backgroundColor = 'transparent';
                button.style.opacity = '1';
                button.title = 'Track this message (auto-resend if deleted)';
            }
        });
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
            const ChannelStore = BdApi.Webpack.getModule(m => m?.getChannel && m?.hasChannel);
            const MessageStore = BdApi.Webpack.getModule(m => m?.getMessage && m?.getMessages);
            
            if (!ChannelStore || !MessageStore) {
                console.warn("[StickyMessageAutoResend] Could not find stores to update message ID");
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

    injectTrackButtons() {
        // Use MutationObserver to watch for messages and add buttons
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        this.addTrackButtonsToElement(node);
                    }
                });
            });
        });

        // Try to find and observe the chat area
        const tryInject = () => {
            const chatContainer = document.querySelector('[class*="chatContent"]');
            if (chatContainer) {
                observer.observe(chatContainer, {
                    childList: true,
                    subtree: true
                });
                
                // Add buttons to existing messages
                this.addTrackButtonsToElement(chatContainer);
                
                this.observerCleanup = () => observer.disconnect();
                console.log("[StickyMessageAutoResend] Track buttons injection started");
                return true;
            }
            return false;
        };

        // Try immediately
        if (!tryInject()) {
            // If not found, retry after a short delay
            console.log("[StickyMessageAutoResend] Chat container not found, retrying...");
            setTimeout(() => {
                if (!tryInject()) {
                    console.warn("[StickyMessageAutoResend] Could not find chat container after retry");
                }
            }, 1000);
        }
    }

    addTrackButtonsToElement(element) {
        // Find all message containers that don't already have our button
        const messages = element.querySelectorAll('[class*="message-"][id^="chat-messages-"]');
        
        messages.forEach((messageEl) => {
            // Skip if already has our button
            if (messageEl.querySelector('.sticky-track-button')) return;
            
            // Find the button container (where React, Reply, etc. buttons are)
            const buttonContainer = messageEl.querySelector('[class*="buttonContainer-"]');
            if (!buttonContainer) return;

            // Get message ID from the message element
            const messageId = this.getMessageIdFromElement(messageEl);
            if (!messageId) return;

            // Create our track button
            const trackButton = document.createElement('div');
            trackButton.className = 'sticky-track-button';
            trackButton.dataset.messageId = messageId;
            
            // Check if this is the tracked message
            const isTracked = this.trackedMessage && this.trackedMessage.id === messageId;
            
            trackButton.style.cssText = `
                display: inline-flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                width: 32px;
                height: 32px;
                border-radius: 4px;
                transition: background-color 0.1s;
                ${isTracked ? 'background-color: var(--brand-experiment); opacity: 0.8;' : ''}
            `;
            trackButton.innerHTML = '📌';
            trackButton.title = isTracked ? 'This message is tracked (click to untrack)' : 'Track this message (auto-resend if deleted)';
            
            trackButton.onmouseover = () => {
                if (!isTracked) {
                    trackButton.style.backgroundColor = 'var(--background-modifier-hover)';
                }
            };
            trackButton.onmouseout = () => {
                if (!isTracked) {
                    trackButton.style.backgroundColor = 'transparent';
                } else {
                    trackButton.style.backgroundColor = 'var(--brand-experiment)';
                }
            };
            
            trackButton.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleTrackButtonClick(messageId);
            };

            // Insert button into container
            buttonContainer.insertBefore(trackButton, buttonContainer.firstChild);
        });
    }

    getMessageIdFromElement(messageEl) {
        // Try to get message ID from the element's id attribute
        const idAttr = messageEl.getAttribute('id');
        if (idAttr) {
            const parts = idAttr.split('-');
            if (parts.length > 2) {
                return parts[parts.length - 1];
            }
        }
        return null;
    }

    handleTrackButtonClick(messageId) {
        // Get the message data from Discord's stores
        const MessageStore = BdApi.Webpack.getModule(m => m?.getMessage && m?.getMessages);
        const ChannelStore = BdApi.Webpack.getModule(m => m?.getChannel && m?.getSelectedChannelId);
        
        if (!MessageStore || !ChannelStore) {
            console.error("[StickyMessageAutoResend] Required stores not found");
            BdApi.UI.showToast("Failed to track message: Stores not found", { type: "error" });
            return;
        }

        const channelId = ChannelStore.getSelectedChannelId();
        const message = MessageStore.getMessage(channelId, messageId);
        
        if (!message) {
            console.error("[StickyMessageAutoResend] Message not found:", messageId);
            BdApi.UI.showToast("Failed to track message: Message not found", { type: "error" });
            return;
        }

        // If this is the currently tracked message, untrack it
        if (this.trackedMessage && this.trackedMessage.id === messageId) {
            this.untrackMessage();
        } else {
            this.trackMessage(message);
        }
    }

    removeTrackButtons() {
        if (this.observerCleanup) {
            this.observerCleanup();
            this.observerCleanup = null;
        }
        
        // Remove all existing buttons
        document.querySelectorAll('.sticky-track-button').forEach(btn => btn.remove());
        console.log("[StickyMessageAutoResend] Track buttons removed");
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
                <li>Hover over any message</li>
                <li>Click the 📌 pin button that appears</li>
                <li>The message will be tracked and automatically resent if deleted</li>
                <li>Click the 📌 button again to untrack the message</li>
            </ol>
            <p style="margin-top: 15px; margin-bottom: 0; color: var(--text-muted); font-size: 14px;">
                <strong>Note:</strong> Only ONE message can be tracked at a time.
            </p>
        `;
        panel.appendChild(instructions);

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
                padding: 8px 16px;
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
