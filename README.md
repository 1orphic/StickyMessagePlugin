# Sticky Message Auto-Resend Plugin

A BetterDiscord plugin that automatically resends a tracked message if it gets deleted.

## Features

- **Settings Panel Interface**: Enter a message ID in the plugin settings to track it
- **Track ONE Message**: Focus on reliability - track one message at a time
- **Auto-Resend**: When the tracked message is deleted, it's automatically resent to the same channel
- **Simple & Reliable**: No DOM manipulation, no context menus - just pure BdApi
- **Persistent Storage**: Tracked message is saved and restored when Discord restarts
- **Visual Feedback**: Toast notifications for all actions

## Installation

1. Download `StickyMessageAutoResend.plugin.js`
2. Place it in your BetterDiscord plugins folder:
   - **Windows**: `%appdata%/BetterDiscord/plugins/`
   - **macOS**: `~/Library/Application Support/BetterDiscord/plugins/`
   - **Linux**: `~/.config/BetterDiscord/plugins/`
3. Enable the plugin in Discord Settings → Plugins

## Usage

### Prerequisites

Enable Developer Mode in Discord to access message IDs:
1. Open Discord Settings
2. Go to Advanced
3. Enable "Developer Mode"

### Tracking a Message

1. Right-click on any message in Discord
2. Select "Copy Message ID" from the context menu
3. Open Discord Settings → Plugins → Sticky Message Auto-Resend → Settings
4. Paste the message ID into the input field
5. Click "Track Message"
6. You'll see a success notification confirming the message is being tracked

### Untracking a Message

1. Open Discord Settings
2. Go to Plugins → Sticky Message Auto-Resend → Settings
3. Click "Untrack Message"

### How It Works

When a tracked message is deleted:
1. The plugin detects the deletion event
2. After a short delay (500ms), it automatically resends the message content
3. The new message replaces the old one in the tracking system
4. You'll see a success notification when the message is resent

## Requirements

- [BetterDiscord](https://betterdiscord.app/) installed and working

## Edge Cases Handled

- **Channel Access**: Checks if the channel still exists before resending
- **Message Tracking**: Automatically updates to track the new message after resending
- **Permissions**: Respects Discord's rate limits and permissions
- **Data Persistence**: Saves tracked message to prevent data loss on restart

## Limitations

- **One message at a time**: Only ONE message can be tracked (by design for simplicity)
- **Text content only**: Cannot resend messages with attachments or embeds
- **Permissions required**: You must have permission to send messages in the channel
- **Appears as you**: The resent message will appear as sent by you, not the original author
- **Rate limits apply**: Subject to Discord's rate limiting

## Troubleshooting

### Plugin not loading
- Ensure BetterDiscord is properly installed
- Look for errors in the console (Ctrl+Shift+I)
- Check that the plugin file is in the correct folder

### "Copy Message ID" not visible
- Enable Developer Mode in Discord Settings → Advanced
- Right-click on a message to see the option

### Message not found when tracking
- Make sure you copied the full message ID
- Navigate to the channel containing the message
- The message must still exist to be tracked

### Message not resending
- Verify you have permission to send messages in the channel
- Check if you've hit Discord's rate limit
- Ensure the channel still exists and you have access to it

### Console errors
- Update BetterDiscord to the latest version
- Report the issue with console logs

## Development

The plugin is built using:
- BetterDiscord native API (BdApi) only
- Discord's internal Webpack modules for message handling
- No DOM manipulation or patching

### Key Components

- **Settings Panel**: Simple HTML form for message ID input
- **Message Tracking**: Stores message data (ID, channel, content) in BdApi.Data storage
- **Event Listening**: Subscribes to Discord's MESSAGE_DELETE dispatcher events
- **Auto-Resend**: Uses MessageActions to resend deleted messages

## License

This plugin is provided as-is for use with BetterDiscord.

## Contributing

Contributions, issues, and feature requests are welcome!

## Changelog

### v4.0.1 - Store Finding Improvements
- **FIXED**: "Required stores not found" error when tracking messages
- Improved Discord module detection with multiple fallback patterns
- Added support for BdApi.Webpack.Filters API
- More robust Webpack module finding for MessageStore, ChannelStore, MessageActions, and Dispatcher
- Better error messages with actionable feedback ("Try reloading Discord")
- Each Discord module now has 4 different search patterns for maximum compatibility

### v4.0.0 - Settings Panel Only (Ultra-Reliable)
- **BREAKING**: Completely removed all DOM manipulation and button injection
- **FIXED**: No more "ContextMenu~Patcher" errors
- **FIXED**: No more "Could not find chat container" errors
- Removed all button injection code (MutationObserver, DOM searching)
- Removed all context menu patching
- Added settings panel with message ID input field
- Users now manually enter message ID from "Copy Message ID" option
- Reduced code from 452 lines to 377 lines (16% reduction from v3)
- Uses ONLY reliable BetterDiscord APIs
- Zero DOM manipulation = zero UI-related errors
- Cleaner, more maintainable code

### v3.0.0 - Simplified Core Functionality
- **BREAKING**: Completely rebuilt from scratch for simplicity and reliability
- Removed context menu integration (unreliable)
- Removed sidebar UI and complex features
- Removed multiple message tracking
- Added simple 📌 button injection into message toolbar
- Now tracks only ONE message at a time
- Reduced code from 1,209 lines to 452 lines (63% reduction)
- Focus on core functionality: track one message, auto-resend when deleted
- Improved reliability with simpler implementation

### v2.3.0 - Previous Complex Version
- Multiple tracking methods (sidebar, context menu, message links)
- Keyboard shortcuts and selection modes
- Complex UI with overlays

### v2.2.0 - Sidebar with Message Link Input
- Replaced pop-up menu with a sidebar panel (Press `Ctrl+Shift+T`)
- Added message link input field
- Display all tracked messages

### v2.1.0 - Pop-up Menu Feature
- Added personal pop-up/modal UI
- Visual indicators for tracked messages

### v2.0.0 - Stability Update
- Improved context menu patching
- Enhanced error handling

### v1.0.0 - Initial Release
- Track specific messages via context menu
- Automatically resend tracked messages
