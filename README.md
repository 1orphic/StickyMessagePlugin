# Sticky Message Auto-Resend Plugin

A BetterDiscord plugin that automatically resends a tracked message if it gets deleted.

## Features

- **Simple Button Interface**: Hover over any message and click the 📌 pin button to track it
- **Track ONE Message**: Focus on reliability - track one message at a time
- **Auto-Resend**: When the tracked message is deleted, it's automatically resent to the same channel
- **Settings Panel**: View and manage your tracked message from the plugin settings
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

### Tracking a Message

1. Hover over any message in Discord
2. Click the 📌 pin button that appears in the message toolbar
3. You'll see a success notification confirming the message is being tracked

### Untracking a Message

**Method 1: Click the button again**
1. Hover over the tracked message
2. Click the 📌 pin button again to untrack

**Method 2: Settings Panel**
1. Open Discord Settings
2. Go to Plugins → Sticky Message Auto-Resend
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

### Button not appearing
- Try scrolling up and down to refresh messages
- Check that the plugin is enabled
- Reload Discord with Ctrl+R

### Message not resending
- Verify you have permission to send messages in the channel
- Check if you've hit Discord's rate limit
- Ensure the channel still exists and you have access to it

### Console errors
- Update BetterDiscord to the latest version
- Report the issue with console logs

## Development

The plugin is built using:
- BetterDiscord native API (BdApi)
- Discord's internal Webpack modules for message handling
- MutationObserver for DOM monitoring

### Key Components

- **Button Injection**: Uses MutationObserver to watch for messages and inject 📌 buttons
- **Message Tracking**: Stores message data (ID, channel, content) in memory and localStorage
- **Event Listening**: Subscribes to Discord's MESSAGE_DELETE dispatcher events
- **Auto-Resend**: Uses MessageActions to resend deleted messages

## License

This plugin is provided as-is for use with BetterDiscord.

## Contributing

Contributions, issues, and feature requests are welcome!

## Changelog

### v3.0.0 - Simplified Core Functionality
- **BREAKING**: Completely rebuilt from scratch for simplicity and reliability
- Removed context menu integration (unreliable)
- Removed sidebar UI and complex features
- Removed multiple message tracking
- Added simple 📌 button injection into message toolbar
- Now tracks only ONE message at a time
- Reduced code from 1,209 lines to 406 lines (66% reduction)
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
