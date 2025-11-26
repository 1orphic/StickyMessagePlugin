# Usage Examples

## Example 1: Tracking a Welcome Message

Let's say you have a welcome message in your Discord server that you want to keep pinned at the top of a channel by automatically resending it if someone deletes it.

### Steps:
1. Post your welcome message: "Welcome to our server! Please read the rules."
2. Right-click on the message
3. Select "Track Message (Auto-Resend)"
4. The message is now protected - if anyone deletes it, it will be automatically reposted

## Example 2: Multiple Tracked Messages

You can track multiple messages across different channels:

### Channel #announcements:
- Track: "Server maintenance scheduled for tomorrow at 3 PM"

### Channel #rules:
- Track: "Rule 1: Be respectful"
- Track: "Rule 2: No spam"

All three messages are independently tracked and will be resent if deleted.

## Example 3: Untracking a Message

When you no longer need a message to be tracked:

### Option A - Via Context Menu:
1. Right-click on the tracked message
2. Select "Untrack Message"

### Option B - Via Settings:
1. Open Settings → Plugins → Sticky Message Auto-Resend
2. Find the message in your tracked messages list
3. Click "Untrack"

## Example 4: Managing Tracked Messages

To see all your currently tracked messages:

1. Open Discord Settings
2. Go to Plugins → Sticky Message Auto-Resend
3. You'll see a list showing:
   - Message content preview
   - Channel name
   - Original author
   - Untrack button for each message

## Technical Details

### What Gets Saved:
- Message ID
- Channel ID
- Message content (text)
- Author information
- Timestamp

### What Happens on Delete:
1. Plugin detects MESSAGE_DELETE event
2. Checks if deleted message ID matches any tracked messages
3. Waits 500ms (to avoid race conditions)
4. Resends the message content to the same channel
5. Updates tracking to monitor the new message ID

### Limitations:
- **Attachments**: Images, files, and other attachments are not preserved
- **Embeds**: Rich embeds are not preserved
- **Author**: The resent message appears to be sent by you (the user running the plugin)
- **Permissions**: You must have send message permissions in the channel
- **Rate Limits**: Subject to Discord's rate limiting

## Best Practices

1. **Use for Important Messages**: Best suited for announcements, rules, or important notices
2. **Don't Overuse**: Tracking too many messages may cause confusion
3. **Regular Cleanup**: Periodically review and untrack messages you no longer need
4. **Permissions**: Ensure you have appropriate permissions before tracking messages
5. **Content Updates**: If you need to update a tracked message, untrack the old one and track the new one

## Troubleshooting Scenarios

### Scenario 1: Message Doesn't Resend
**Possible Causes:**
- You don't have permission to send messages in that channel
- The channel was deleted
- Discord rate limit reached

**Solution:**
- Check channel permissions
- Verify the channel still exists
- Wait a few minutes if rate limited

### Scenario 2: Tracking Doesn't Persist After Restart
**Possible Causes:**
- BetterDiscord data folder permissions issue
- Plugin not properly saved settings

**Solution:**
- Check BetterDiscord logs
- Reinstall the plugin
- Verify BetterDiscord has write permissions to its data folder

### Scenario 3: Context Menu Item Not Appearing
**Possible Causes:**
- Plugin not fully loaded
- Another plugin conflict
- BetterDiscord needs restart

**Solution:**
- Restart Discord
- Disable other plugins to test for conflicts
- Check console for errors
