# Implementation Details

This document provides technical details about how the Sticky Message Auto-Resend plugin is implemented.

## Architecture Overview

The plugin follows the BetterDiscord plugin structure and uses only the native BetterDiscord API (BdApi).

```
StickyMessageAutoResend
│
├── Plugin Meta Header
└── Main Plugin Class
    ├── Data Management
    ├── Event Handling
    ├── UI Components
    └── Message Operations
```

## Core Components

### 1. Plugin Meta Header

```javascript
/**
 * @name StickyMessageAutoResend
 * @author BetterDiscord Community
 * @description Automatically resends a tracked message if it gets deleted
 * @version 2.0.0
 */
```

This header is parsed by BetterDiscord to display plugin information.

### 2. Plugin Class

The plugin is a simple ES6 class that exports directly:

```javascript
module.exports = class StickyMessageAutoResend {
    constructor() { /* ... */ }
    start() { /* ... */ }
    stop() { /* ... */ }
    // ... other methods
};
```

## Data Structures

### Tracked Message Data

```javascript
{
    id: "message_id_123",
    channelId: "channel_id_456",
    content: "Message text content",
    embeds: [],
    attachments: [],
    author: {
        id: "user_id",
        username: "Username",
        discriminator: "1234"
    },
    timestamp: "2024-01-01T00:00:00.000Z"
}
```

### Storage Structure

```javascript
trackedMessages = Map<messageId, messageData>
```

Stored in BetterDiscord's data storage as JSON:
```javascript
{
    "message_id_1": { /* messageData */ },
    "message_id_2": { /* messageData */ }
}
```

## Key Methods

### start()

Called when plugin is enabled.

```javascript
start() {
    this.loadSettings();           // Load saved tracked messages
    this.patchContextMenu();       // Add context menu items
    this.startMessageDeleteListener(); // Subscribe to events
    BdApi.UI.showToast("Plugin started!", { type: "success" });
}
```

### stop()

Called when plugin is disabled.

```javascript
stop() {
    this.stopMessageDeleteListener(); // Unsubscribe from events
    BdApi.Patcher.unpatchAll(this.getName());  // Remove patches
    BdApi.UI.showToast("Plugin stopped!", { type: "info" });
}
```

### trackMessage(message)

Stores message data for tracking.

**Flow:**
1. Extract message data (content, channel, author, etc.)
2. Add to `trackedMessages` Map
3. Save to persistent storage
4. Show success notification

### untrackMessage(messageId)

Removes message from tracking.

**Flow:**
1. Delete from `trackedMessages` Map
2. Save to persistent storage
3. Show info notification

### startMessageDeleteListener()

Subscribes to Discord's MESSAGE_DELETE event.

**Implementation:**
```javascript
const Dispatcher = BdApi.Webpack.getModule(
    m => m?.subscribe && m?.dispatch
);
this.messageDeleteHandler = (event) => {
    if (event.type === "MESSAGE_DELETE") {
        this.handleMessageDelete(event);
    }
};
Dispatcher.subscribe("MESSAGE_DELETE", this.messageDeleteHandler);
```

### handleMessageDelete(event)

Processes deletion events.

**Flow:**
1. Extract message ID and channel ID from event
2. Check if message is tracked
3. If tracked, wait 500ms (debounce)
4. Call `resendMessage()`

### resendMessage(messageData)

Resends the deleted message.

**Flow:**
1. Verify channel exists
2. Prepare message payload
3. Send message using Discord API
4. Wait for new message confirmation
5. Update tracked message with new ID
6. Show success notification

**Error Handling:**
- Channel not found → Show error toast
- Send failure → Log error and notify user
- Network issues → Caught and logged

### waitForNewMessage(channelId, content, timeout)

Waits for the resent message to appear.

**Implementation:**
```javascript
async waitForNewMessage(channelId, content, timeout = 3000) {
    return new Promise((resolve) => {
        const handler = (event) => {
            if (event.type === "MESSAGE_CREATE" && 
                event.channelId === channelId &&
                event.message.content === content &&
                event.message.author.id === UserStore.getCurrentUser().id) {
                Dispatcher.unsubscribe("MESSAGE_CREATE", handler);
                resolve(event.message);
            }
        };
        Dispatcher.subscribe("MESSAGE_CREATE", handler);
        setTimeout(() => {
            Dispatcher.unsubscribe("MESSAGE_CREATE", handler);
            resolve(null);
        }, timeout);
    });
}
```

### patchContextMenu()

Adds custom menu items to message context menu.

**Implementation:**
```javascript
const MessageContextMenu = BdApi.Webpack.getModule(
    m => m?.default?.displayName === "MessageContextMenu"
);

BdApi.Patcher.after(this.getName(), MessageContextMenu, "default", (_, [props], returnValue) => {
    const message = props.message;
    const isTracked = this.trackedMessages.has(message.id);
    
    const menuItem = BdApi.ContextMenu.buildItem({
        type: "text",
        label: isTracked ? "Untrack Message" : "Track Message (Auto-Resend)",
        action: () => { /* track or untrack */ }
    });
    
    returnValue.props.children.push(menuItem);
});
```

### getSettingsPanel()

Creates the settings UI.

**Components:**
1. Title ("Tracked Messages")
2. Message list (if messages exist)
   - Content preview
   - Channel name
   - Author username
   - Untrack button
3. Empty state (if no messages)
4. Instructions section

**Styling:**
- Uses CSS variables for Discord theme compatibility
- Responsive layout
- Interactive buttons

## Discord API Integration

### Webpack Modules

The plugin uses Discord's internal Webpack modules via BdApi:

```javascript
const Dispatcher = BdApi.Webpack.getModule(m => m?.subscribe && m?.dispatch);
const MessageActions = BdApi.Webpack.getModule(m => m?.sendMessage && m?.receiveMessage);
const ChannelStore = BdApi.Webpack.getModule(m => m?.getChannel && m?.hasChannel);
const UserStore = BdApi.Webpack.getModule(m => m?.getCurrentUser && m?.getUser);
```

**Key Modules:**
- `Dispatcher` - Event system
- `MessageActions` - Send messages
- `MessageQueue` - Message queue management
- `ChannelStore` - Get channel data
- `UserStore` - Get user data

### Event System

Discord uses a Flux-like dispatcher:

```javascript
Dispatcher.subscribe("EVENT_NAME", handler);
Dispatcher.unsubscribe("EVENT_NAME", handler);
```

**Events Used:**
- `MESSAGE_DELETE` - Message deletion
- `MESSAGE_CREATE` - Message creation

## Data Persistence

### Storage API

Uses BetterDiscord's Data API:

```javascript
BdApi.Data.save(pluginName, key, value);
BdApi.Data.load(pluginName, key);
```

### Serialization

```javascript
// Save
const obj = Object.fromEntries(this.trackedMessages);
BdApi.Data.save(this.getName(), "trackedMessages", JSON.stringify(obj));

// Load
const savedMessages = BdApi.Data.load(this.getName(), "trackedMessages");
const parsed = JSON.parse(savedMessages);
this.trackedMessages = new Map(Object.entries(parsed));
```

## Error Handling

### Try-Catch Blocks

All async operations and API calls are wrapped in try-catch:

```javascript
try {
    // Operation
} catch (error) {
    console.error("Error:", error);
    BdApi.UI.showToast("User-friendly message", { type: "error" });
}
```

### Validation

- Check if channel exists before sending
- Verify message data is complete
- Validate JSON during deserialization

### Graceful Degradation

- Continue operation if one message fails
- Log errors for debugging
- Show user notifications for important errors

## Performance Considerations

### Memory Management

- Uses Map for O(1) lookups
- Cleans up event listeners on stop
- Removes patches on disable

### Event Throttling

- 500ms delay before resend (prevents race conditions)
- Timeout on message confirmation (3 seconds)

### Data Efficiency

- Only stores necessary message data
- JSON serialization for storage
- No polling - uses event-driven architecture

## Security Considerations

### Permission Checks

- Verifies channel access before resend
- Respects Discord's rate limits
- No elevation of privileges

### Data Privacy

- Data stored locally only
- No external API calls
- No telemetry or tracking

### Input Validation

- Sanitizes message content
- Validates message IDs
- Checks for null/undefined values

## Limitations

### Current Limitations

1. **Content Only**: Only text content is preserved
   - No attachments
   - No complex embeds
   - No stickers

2. **Author Change**: Resent message appears from plugin user
   - Not the original author
   - Can't spoof other users (security feature)

3. **Rate Limits**: Subject to Discord's limits
   - Max 5 messages per 5 seconds
   - 10 embeds per message
   - 2000 character limit

### Future Enhancements

Potential improvements:
- Attachment URL preservation
- Embed recreation
- Scheduled resends
- Multi-message sequences
- Custom resend delays
- Message edit tracking

## Testing Strategy

### Unit Testing

Currently manual testing. Potential unit tests:
- Data serialization/deserialization
- Message data extraction
- ID validation

### Integration Testing

Test with Discord:
- Context menu integration
- Event listener functionality
- Message sending
- Data persistence

### Manual Testing

See [TEST_PLAN.md](TEST_PLAN.md) for comprehensive test cases.

## Debugging

### Console Logging

Enable debug mode by adding:
```javascript
this.debug = true;
```

### Common Issues

1. **Context menu not appearing**
   - Check Patcher applied correctly
   - Verify WebpackModules found MessageContextMenu

2. **Message not resending**
   - Check Dispatcher subscribed
   - Verify MessageActions available
   - Check console for errors

3. **Data not persisting**
   - Verify BdApi.Data is available
   - Check JSON serialization
   - Ensure plugin name is correct

## Dependencies

### Required

- BetterDiscord (latest version)

### Discord API

- Internal Webpack modules (no external API calls)
- Uses undocumented APIs (subject to change)

## Version History

### v2.0.0 - Native API Refactor

Changes:
- Removed ZeresPluginLibrary dependency
- Refactored to use BetterDiscord native API only
- Updated all API calls to use BdApi
- Improved stability and compatibility

### v1.0.0 - Initial Release

Features:
- Track messages via context menu
- Auto-resend on deletion
- Settings panel UI
- Data persistence
- Multiple message support

## Future Roadmap

Potential features for future versions:

1. **v1.1.0**
   - Message edit tracking
   - Custom resend delays
   - Bulk operations

2. **v1.2.0**
   - Attachment support
   - Embed preservation
   - Message templates

3. **v2.0.0**
   - Multiple channel support
   - Scheduled messages
   - Advanced filters
   - Export/import settings

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

## License

MIT License - See [LICENSE](LICENSE) file.
