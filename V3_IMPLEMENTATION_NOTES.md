# Version 3.0.0 Implementation Notes

## Overview

This version represents a complete rebuild of the plugin focusing exclusively on core functionality: **track ONE message and automatically resend it when deleted**.

## What Was Built

### Core Architecture

1. **Simple Button Injection**
   - Uses `MutationObserver` to watch for new messages
   - Injects a 📌 button into message toolbars dynamically
   - Retry mechanism if chat container isn't immediately available
   - Visual indicator (blue highlight) for the tracked message

2. **Message Tracking**
   - Stores message data: `{ id, channelId, content, timestamp }`
   - Persists to localStorage via `BdApi.Data`
   - Only ONE message can be tracked at a time
   - Toggle tracking by clicking the same button again

3. **Deletion Detection**
   - Subscribes to Discord's `MESSAGE_DELETE` event via Dispatcher
   - Compares deleted message ID with tracked message ID
   - Triggers resend after 500ms delay

4. **Auto-Resend**
   - Uses `MessageActions.sendMessage()` to resend content
   - Updates tracked message ID to the new message
   - Continues tracking the new message automatically

5. **Settings Panel**
   - Shows current tracking status
   - Displays tracked message details (channel, content, ID)
   - Provides untrack button
   - Instructions for users

## Technical Implementation

### Key Methods

```javascript
start()                      // Initialize plugin, load data, start listeners
stop()                       // Cleanup observers, listeners, buttons
loadTrackedMessage()         // Load from localStorage
saveTrackedMessage()         // Save to localStorage
trackMessage(message)        // Store message and update UI
untrackMessage()            // Clear tracking and update UI
updateButtonStates()        // Update all button visual states
startMessageDeleteListener() // Subscribe to MESSAGE_DELETE
handleMessageDelete(event)   // Check if tracked message deleted
resendMessage()             // Send message via MessageActions
updateTrackedMessageId()    // Update ID after resend
injectTrackButtons()        // Start MutationObserver
addTrackButtonsToElement()  // Inject buttons into messages
getMessageIdFromElement()   // Extract message ID from DOM
handleTrackButtonClick()    // Handle button click
removeTrackButtons()        // Cleanup on stop
getSettingsPanel()          // Create settings UI
```

### Dependencies

- **BdApi.Webpack**: Get Discord internal modules
  - `Dispatcher`: Subscribe to events
  - `MessageActions`: Send messages
  - `MessageStore`: Get message data
  - `ChannelStore`: Get channel data
- **BdApi.Data**: Persistent storage
- **BdApi.UI**: Toast notifications
- **MutationObserver**: Watch for DOM changes (native browser API)

### DOM Structure

The plugin looks for:
- Chat container: `[class*="chatContent"]`
- Message elements: `[class*="message-"][id^="chat-messages-"]`
- Button containers: `[class*="buttonContainer-"]`
- Message IDs: Extracted from element ID attribute

## Features Implemented

✅ Button injection with MutationObserver  
✅ Visual indicator for tracked message (blue highlight)  
✅ Toggle tracking with same button  
✅ Persistent storage across sessions  
✅ Auto-resend on deletion  
✅ Update tracking to new message after resend  
✅ Settings panel with status and untrack option  
✅ Toast notifications for all actions  
✅ Error handling with user feedback  
✅ Retry mechanism for button injection  
✅ Proper cleanup on stop  

## Features Removed

❌ Context menu integration  
❌ Sidebar UI  
❌ Keyboard shortcuts (Ctrl+Shift+T)  
❌ Message link parsing  
❌ Selection mode with overlay  
❌ Multiple message tracking  
❌ Click-to-select functionality  

## Code Quality

- **Lines of code**: 451 (down from 1,209, 62% reduction)
- **Complexity**: Low - single responsibility methods
- **Error handling**: Try-catch blocks with user feedback
- **Console logging**: Informative logs for debugging
- **Comments**: Minimal but clear
- **Code style**: ES6+, arrow functions, const/let, optional chaining

## Known Limitations

1. **DOM dependency**: Button injection relies on Discord's class names
   - May break if Discord changes their UI
   - Selectors use wildcards (`[class*="..."]`) for resilience
   
2. **Text content only**: Only resends message text
   - No embeds, attachments, or formatting preservation
   - Could be extended in future if needed

3. **Single message**: Only one message can be tracked
   - By design for simplicity
   - Could support multiple if really needed

4. **Button visibility**: Buttons only visible on hover
   - Follows Discord's native pattern
   - Users need to discover the feature

## Testing Recommendations

1. **Button Injection**
   - Test with fresh Discord load
   - Test after switching channels
   - Test with new messages being sent
   - Test scrolling up (old messages)

2. **Tracking**
   - Track a message, verify toast
   - Check button turns blue
   - Track different message, verify switch
   - Untrack, verify button returns to normal

3. **Deletion & Resend**
   - Delete tracked message, verify resend
   - Check new message has same content
   - Verify tracking continues on new message
   - Delete new message, verify resends again

4. **Persistence**
   - Track message, reload Discord
   - Verify tracking persists
   - Delete message after reload
   - Verify still resends

5. **Settings Panel**
   - Open settings, check status
   - Track message, check status updates
   - Click untrack, verify works
   - Check status shows "no message tracked"

## Future Enhancements (If Needed)

1. **Alternative tracking methods** (if button injection proves unreliable):
   - Command-based: Type `!track` to track last message
   - Keyboard shortcut: Ctrl+Shift+P while hovering
   - Message ID input in settings

2. **Enhanced content support**:
   - Save embeds data
   - Save attachment URLs (with disclaimer)
   - Preserve markdown formatting

3. **Multiple messages**:
   - Track up to 3-5 messages
   - Simple list in settings
   - Indicate which messages are tracked

4. **Better visual feedback**:
   - Add badge to tracked message
   - Show countdown before resend
   - Show "resending..." indicator

However, these should only be added if users specifically request them. The current implementation prioritizes **simplicity and reliability**.

## Migration from v2.x

Users upgrading from v2.x will lose their multiple tracked messages. The plugin will only track ONE message going forward. This is intentional and communicated in the changelog.

Old data structure:
```javascript
trackedMessages: Map<messageId, messageData>
```

New data structure:
```javascript
trackedMessage: { id, channelId, content, timestamp } | null
```

No automatic migration needed - users will simply need to re-track their message using the new button system.
