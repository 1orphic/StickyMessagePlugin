# Plugin Simplification - v3.0.0

## What Changed

The plugin has been completely rebuilt from scratch to focus on **core functionality only**. All complex and unreliable features have been removed.

## Version 3.0.0 - Core Features Only

### What Was Removed ❌
- ❌ Context menu integration (unreliable patching)
- ❌ Sidebar UI with keyboard shortcuts
- ❌ Message link parsing
- ❌ Selection mode with overlays
- ❌ Multiple message tracking
- ❌ Complex UI components

### What Remains ✅
- ✅ Track ONE message at a time
- ✅ Simple 📌 button injection into message hover toolbar
- ✅ Automatic message deletion detection
- ✅ Automatic message resending
- ✅ Persistent storage of tracked message
- ✅ Basic settings panel

## How It Works

### Simple User Flow
1. Hover over any message in Discord
2. Click the 📌 pin button that appears in the message toolbar
3. The message is now tracked
4. If the message gets deleted, it's automatically resent
5. Click 📌 again to untrack

### Technical Implementation

#### Message Tracking
- Uses `MutationObserver` to watch for new messages in the chat
- Injects a 📌 button into the message toolbar (same area as React, Reply, etc.)
- Button is added to all visible messages dynamically

#### Message Deletion Detection
- Subscribes to Discord's `MESSAGE_DELETE` event via Dispatcher
- Compares deleted message ID with tracked message ID
- Triggers resend when match is found

#### Message Resending
- Uses `MessageActions.sendMessage()` to resend the message content
- Updates the tracked message ID after successful resend
- Shows toast notifications for user feedback

## Code Statistics

### Before
- **1,209 lines** of code
- Multiple complex features
- Context menu patching (2 methods)
- Sidebar UI system
- Message link parsing
- Selection mode overlay

### After
- **406 lines** of code (66% reduction)
- Single simple feature
- Button injection only
- No complex UI
- No context menus
- No selection modes

## Benefits

1. **Reliability**: No dependency on unreliable context menu patching
2. **Simplicity**: One clear way to track messages
3. **Maintainability**: Much less code to maintain
4. **Performance**: No complex UI or multiple event listeners
5. **User Experience**: Simple, intuitive interaction

## Known Limitations

1. **Only ONE message** can be tracked at a time (by design)
2. **Button injection** relies on Discord's DOM structure (may need updates if Discord changes their UI)
3. **No message link support** (removed for simplicity)
4. **Text-only messages** (embeds/attachments not supported in this simplified version)

## Future Considerations

If the button injection approach proves unreliable, alternative simple methods:
- Simple command: Type `!track` in chat to track the last message
- Keyboard shortcut: Press `Ctrl+Shift+P` to track the message you're replying to
- Settings panel: Paste message ID to track

The focus remains on **simplicity and reliability** over features.
