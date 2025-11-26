# Version 3.0.0 Test Checklist

## Core Functionality Tests

### ✅ Plugin Loading
- [ ] Plugin loads without errors in BetterDiscord
- [ ] No console errors on startup
- [ ] Success toast notification appears

### ✅ Button Injection
- [ ] 📌 button appears when hovering over messages
- [ ] Button is positioned correctly in message toolbar
- [ ] Button appears on all visible messages
- [ ] Button appears on newly sent messages (MutationObserver working)
- [ ] Button hover effect works

### ✅ Message Tracking
- [ ] Clicking 📌 button tracks the message
- [ ] Success toast notification appears
- [ ] Message data is stored correctly
- [ ] Only ONE message can be tracked at a time
- [ ] Clicking 📌 on a different message replaces the tracked message
- [ ] Clicking 📌 on the tracked message untracks it

### ✅ Message Deletion Detection
- [ ] Plugin detects when tracked message is deleted
- [ ] Console log shows detection
- [ ] Resend is triggered after 500ms delay

### ✅ Auto-Resend
- [ ] Message is resent with identical content
- [ ] Success toast notification appears
- [ ] New message appears in the same channel
- [ ] Tracked message ID is updated to new message
- [ ] Plugin continues to track the new message

### ✅ Persistent Storage
- [ ] Tracked message is saved to localStorage
- [ ] Tracked message persists after Discord restart
- [ ] Tracked message persists after plugin reload

### ✅ Settings Panel
- [ ] Settings panel opens correctly
- [ ] Instructions are clear and accurate
- [ ] Current status shows "No message tracked" when nothing is tracked
- [ ] Current status shows tracked message details when tracking
- [ ] "Untrack Message" button works
- [ ] Settings panel updates after untracking

### ✅ Error Handling
- [ ] Graceful failure if Dispatcher not found
- [ ] Graceful failure if MessageActions not found
- [ ] Graceful failure if message stores not found
- [ ] Error toast notifications for failures
- [ ] Console logs for debugging

### ✅ Cleanup
- [ ] MutationObserver is disconnected on stop
- [ ] Event listeners are unsubscribed on stop
- [ ] Injected buttons are removed on stop
- [ ] No memory leaks

## Edge Cases

### ✅ Discord UI
- [ ] Works with different Discord themes
- [ ] Works in DMs (Direct Messages)
- [ ] Works in group DMs
- [ ] Works in server channels
- [ ] Works with compact message mode
- [ ] Works with cozy message mode

### ✅ Message Types
- [ ] Works with text-only messages
- [ ] Handles empty/whitespace messages
- [ ] Works with long messages
- [ ] Works with emojis in messages
- [ ] Works with markdown formatting
- [ ] Handles messages you sent
- [ ] Handles messages others sent

### ✅ Channel Operations
- [ ] Switching channels doesn't break tracking
- [ ] Closing DMs doesn't break tracking
- [ ] Leaving server doesn't crash plugin
- [ ] Channel permissions are respected

## Performance

- [ ] Button injection is fast (<100ms)
- [ ] No noticeable lag when scrolling
- [ ] No excessive DOM mutations
- [ ] Memory usage is reasonable
- [ ] CPU usage is minimal

## Regression Tests

### ❌ Removed Features (should NOT exist)
- [ ] No context menu items
- [ ] No sidebar UI
- [ ] No keyboard shortcuts
- [ ] No message link parsing
- [ ] No selection mode
- [ ] No multiple message tracking

## Known Issues to Document

1. Button injection relies on Discord's DOM structure (may break with Discord updates)
2. Only tracks text content (no embeds or attachments)
3. Only ONE message can be tracked
4. Resent messages appear as sent by current user

## Manual Test Procedure

1. **Install and Load**
   - Copy plugin to plugins folder
   - Enable in BetterDiscord settings
   - Verify success toast

2. **Track a Message**
   - Send a test message: "Test message for tracking"
   - Hover over the message
   - Click the 📌 button
   - Verify success toast

3. **Delete and Verify Resend**
   - Delete the tracked message
   - Wait 1 second
   - Verify message is resent
   - Verify success toast

4. **Verify Persistence**
   - Reload Discord (Ctrl+R)
   - Delete the tracked message again
   - Verify it still resends

5. **Test Untracking**
   - Track a message
   - Click 📌 again to untrack
   - Delete the message
   - Verify it does NOT resend

6. **Test Settings Panel**
   - Open Plugin Settings
   - Verify current status
   - Track a message
   - Refresh settings panel
   - Verify tracked message details
   - Click "Untrack Message"
   - Verify status updates

## Success Criteria

All core functionality tests must pass:
- ✅ Button injection works
- ✅ Message tracking works
- ✅ Deletion detection works
- ✅ Auto-resend works
- ✅ Persistence works
- ✅ Settings panel works
