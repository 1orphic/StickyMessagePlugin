# Sticky Message Auto-Resend Plugin

A BetterDiscord plugin that automatically resends a tracked message if it gets deleted.

## Features

- **Sidebar with Message Link Input**: Press `Ctrl+Shift+T` to open a sidebar where you can paste Discord message links to track them
- **Track Messages**: Paste a message link in the sidebar or right-click any message and select "Track Message (Auto-Resend)"
- **Auto-Resend**: When a tracked message is deleted, it's automatically resent to the same channel
- **Multiple Messages**: Track multiple messages across different channels
- **Settings Panel**: View and manage all tracked messages from the plugin settings
- **Persistent Storage**: Tracked messages are saved and restored when Discord restarts
- **Visual Feedback**: Sidebar shows all tracked messages with easy untrack buttons

## Installation

1. Download `StickyMessageAutoResend.plugin.js`
2. Place it in your BetterDiscord plugins folder:
   - **Windows**: `%appdata%/BetterDiscord/plugins/`
   - **macOS**: `~/Library/Application Support/BetterDiscord/plugins/`
   - **Linux**: `~/.config/BetterDiscord/plugins/`
3. Enable the plugin in Discord Settings → Plugins

## Usage

### Tracking a Message

**Method 1: Message Link Sidebar (Recommended)**
1. Right-click on any message in Discord and select "Copy Message Link"
2. Press `Ctrl+Shift+T` to open the tracking sidebar
3. Paste the message link into the input field
4. Click "Track" or press Enter
5. You'll see a success notification confirming the message is being tracked

**Method 2: Context Menu**
1. Right-click on any message you want to track
2. Click "Track Message (Auto-Resend)" from the context menu
3. You'll see a success notification confirming the message is being tracked

### Untracking a Message

**Method 1: Sidebar**
1. Press `Ctrl+Shift+T` to open the tracking sidebar
2. Click "Untrack" next to the message you want to stop monitoring

**Method 2: Context Menu**
1. Right-click on the tracked message
2. Click "Untrack Message"

**Method 3: Settings Panel**
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

### v2.2.0 - Sidebar with Message Link Input
- Replaced pop-up menu with a sidebar panel (Press `Ctrl+Shift+T`)
- Added message link input field to track messages from any channel
- Parse Discord message links to extract message ID and channel ID
- Display all tracked messages in the sidebar with easy management
- Keyboard shortcut support (`Ctrl+Shift+T` to toggle, `Esc` to close, `Enter` to submit)
- Improved reliability - no longer depends on MessageStore._array
- Cleaner UI with slide-in animation from the right
- Better mobile/responsive support with max-width

### v2.1.0 - Pop-up Menu Feature
- Added personal pop-up/modal UI for tracking messages (Press `Ctrl+Shift+T`)
- Display recent messages with preview, author, and timestamp
- Visual indicators for tracked messages
- Easy track/untrack buttons in the pop-up
- Keyboard shortcut support (`Ctrl+Shift+T` to open, `Esc` to close)
- Shows user's own messages with "YOU" badge
- Improved user experience with animations and Discord-themed styling

### v2.0.0 - Stability Update
- Improved context menu patching with fallback methods
- Enhanced error handling and user feedback
- Updated to use native BetterDiscord API

### v1.0.0 - Initial Release
- Track specific messages via context menu
- Automatically resend tracked messages when deleted
- Configure tracked messages via settings panel
- Support for multiple tracked messages per channel
