# Sticky Message Auto-Resend Plugin

A BetterDiscord plugin that automatically resends a tracked message if it gets deleted.

## Features

- **Track Messages**: Right-click any message and select "Track Message (Auto-Resend)" to start monitoring it
- **Auto-Resend**: When a tracked message is deleted, it's automatically resent to the same channel
- **Multiple Messages**: Track multiple messages across different channels
- **Settings Panel**: View and manage all tracked messages from the plugin settings
- **Persistent Storage**: Tracked messages are saved and restored when Discord restarts

## Installation

1. Download `StickyMessageAutoResend.plugin.js`
2. Place it in your BetterDiscord plugins folder:
   - **Windows**: `%appdata%/BetterDiscord/plugins/`
   - **macOS**: `~/Library/Application Support/BetterDiscord/plugins/`
   - **Linux**: `~/.config/BetterDiscord/plugins/`
3. Enable the plugin in Discord Settings → Plugins

## Usage

### Tracking a Message

1. Right-click on any message you want to track
2. Click "Track Message (Auto-Resend)" from the context menu
3. You'll see a success notification confirming the message is being tracked

### Untracking a Message

**Method 1: Context Menu**
1. Right-click on the tracked message
2. Click "Untrack Message"

**Method 2: Settings Panel**
1. Open Discord Settings
2. Go to Plugins → Sticky Message Auto-Resend
3. Click "Untrack" next to the message you want to remove

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
- **Data Persistence**: Saves tracked messages to prevent data loss on restart

## Limitations

- Cannot resend messages with attachments or complex embeds (only text content)
- Requires you to have permission to send messages in the channel
- The resent message will appear as sent by you, not the original author
- Subject to Discord's rate limiting

## Troubleshooting

### Plugin not loading
- Ensure BetterDiscord is properly installed
- Look for errors in the console (Ctrl+Shift+I)

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

### Key Components

- **Message Tracking**: Stores message data (ID, channel, content, author) in memory and localStorage
- **Event Listening**: Subscribes to Discord's MESSAGE_DELETE dispatcher events
- **Context Menu**: Patches Discord's message context menu to add track/untrack options
- **Settings Panel**: Custom UI for viewing and managing tracked messages

## License

This plugin is provided as-is for use with BetterDiscord.

## Contributing

Contributions, issues, and feature requests are welcome!

## Changelog

### v1.0.0 - Initial Release
- Track specific messages via context menu
- Automatically resend tracked messages when deleted
- Configure tracked messages via settings panel
- Support for multiple tracked messages per channel
