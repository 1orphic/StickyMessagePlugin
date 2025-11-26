# Quick Start Guide - v3.0.0

## What This Plugin Does

Tracks ONE message and automatically resends it when deleted.

## Installation

1. Download `StickyMessageAutoResend.plugin.js`
2. Put it in: `%appdata%/BetterDiscord/plugins/` (Windows)
3. Enable in Discord Settings → Plugins

## How to Use

### Track a Message

1. **Hover** over any message
2. **Click** the 📌 pin button (appears with React, Reply buttons)
3. Button turns **blue** = message is tracked
4. You'll see: ✓ "Message tracked! It will auto-resend if deleted."

### What Happens When Deleted?

- Plugin detects deletion automatically
- Waits 500ms
- Resends the message with identical text
- Continues tracking the new message
- You'll see: ✓ "Tracked message resent!"

### Untrack a Message

**Option 1:** Click the 📌 button again  
**Option 2:** Open Settings → Plugins → Sticky Message Auto-Resend → Click "Untrack Message"

## Important Notes

⚠️ **Only ONE message** can be tracked at a time  
⚠️ **Text only** - attachments/embeds are not resent  
⚠️ Resent message **appears as you** (not original author)  

## Troubleshooting

**Button not showing?**
- Scroll up/down to refresh messages
- Reload Discord (Ctrl+R)
- Check plugin is enabled

**Message not resending?**
- Check you have send permissions in that channel
- Check for Discord rate limits
- Open console (Ctrl+Shift+I) to see errors

**Plugin not loading?**
- Make sure BetterDiscord is installed
- Check for errors in console (Ctrl+Shift+I)
- Reinstall plugin file

## That's It!

Simple, reliable, focused on core functionality.

Need more help? Check the full README.md or open an issue.
