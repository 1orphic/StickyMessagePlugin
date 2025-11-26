# Test Plan - Sticky Message Auto-Resend Plugin

## Overview
This document outlines the testing strategy for the Sticky Message Auto-Resend BetterDiscord plugin.

## Pre-requisites
- BetterDiscord installed and working
- ZeresPluginLibrary installed
- Access to a Discord server where you can send and delete messages

## Test Cases

### 1. Plugin Installation and Loading
**Objective**: Verify the plugin loads correctly

**Steps**:
1. Place `StickyMessageAutoResend.plugin.js` in BetterDiscord plugins folder
2. Restart Discord or reload plugins
3. Navigate to Settings → Plugins
4. Locate "Sticky Message Auto-Resend" in the plugin list
5. Enable the plugin

**Expected Results**:
- Plugin appears in the list
- No console errors on startup
- Success toast notification appears: "StickyMessageAutoResend has started!"

### 2. Context Menu Integration
**Objective**: Verify context menu item appears

**Steps**:
1. Navigate to any Discord channel
2. Right-click on any message
3. Look for "Track Message (Auto-Resend)" option

**Expected Results**:
- Context menu option is visible
- Option is clickable
- No console errors

### 3. Track Single Message
**Objective**: Verify basic message tracking functionality

**Steps**:
1. Send a test message: "Test Message 1"
2. Right-click the message
3. Click "Track Message (Auto-Resend)"
4. Observe the notification

**Expected Results**:
- Success toast: "Message is now being tracked!"
- No console errors
- Message ID is stored

### 4. Message Auto-Resend
**Objective**: Verify message is resent when deleted

**Steps**:
1. Track a message (follow Test Case 3)
2. Delete the tracked message
3. Wait for auto-resend (should be ~500ms delay)
4. Observe the channel

**Expected Results**:
- Message reappears in the channel with same content
- Success toast: "Tracked message resent successfully!"
- New message is now being tracked instead of old one

### 5. Untrack Message via Context Menu
**Objective**: Verify untracking functionality

**Steps**:
1. Track a message
2. Right-click the tracked message
3. Verify option shows "Untrack Message"
4. Click "Untrack Message"
5. Observe the notification

**Expected Results**:
- Context menu shows "Untrack Message" for tracked messages
- Info toast: "Message untracked"
- Message is removed from tracked list

### 6. Settings Panel Display
**Objective**: Verify settings panel shows tracked messages

**Steps**:
1. Track 2-3 messages in different channels
2. Navigate to Settings → Plugins → Sticky Message Auto-Resend
3. Review the settings panel

**Expected Results**:
- All tracked messages are displayed
- Message content preview is shown
- Channel name is displayed correctly
- Original author is shown
- Untrack button is available for each message

### 7. Untrack via Settings Panel
**Objective**: Verify untracking from settings works

**Steps**:
1. Track a message
2. Open plugin settings
3. Click "Untrack" button next to the message
4. Observe the UI and notification

**Expected Results**:
- Info toast: "Message untracked"
- Message is removed from the list immediately
- If no messages remain, shows "No messages are currently being tracked."

### 8. Multiple Messages Tracking
**Objective**: Verify multiple messages can be tracked simultaneously

**Steps**:
1. Track message A in channel 1
2. Track message B in channel 2
3. Track message C in channel 1
4. Delete message B
5. Delete message A
6. Delete message C

**Expected Results**:
- All three messages can be tracked simultaneously
- Each deletion triggers correct resend
- Messages are resent in correct channels
- All tracked messages are updated with new IDs

### 9. Data Persistence
**Objective**: Verify tracked messages persist across Discord restarts

**Steps**:
1. Track 2-3 messages
2. Restart Discord
3. Re-enable the plugin if needed
4. Check settings panel

**Expected Results**:
- Tracked messages are still present after restart
- All message data is intact
- No console errors on load

### 10. Empty Message Content
**Objective**: Test edge case with empty or whitespace-only content

**Steps**:
1. Attempt to track a message with no text content (only embeds/attachments)
2. Delete the message
3. Observe behavior

**Expected Results**:
- Plugin tracks the message
- Resends with empty content (may show as blank message)
- No errors or crashes

### 11. Channel Not Found
**Objective**: Test edge case when channel is deleted

**Steps**:
1. Track a message in a channel
2. Have server admin delete the channel
3. Trigger condition that would cause resend (simulate or wait)

**Expected Results**:
- Error toast: "Cannot resend message: Channel not found"
- No console errors or crashes
- Plugin continues to function

### 12. Permission Handling
**Objective**: Test behavior without send message permission

**Steps**:
1. Track a message in a channel
2. Have admin remove your send message permission
3. Delete the tracked message

**Expected Results**:
- Plugin attempts to resend
- Error is handled gracefully
- Appropriate error message shown (may vary based on Discord API response)

### 13. Rate Limiting
**Objective**: Test behavior under rate limiting

**Steps**:
1. Track 5+ messages
2. Delete all tracked messages rapidly
3. Observe resend behavior

**Expected Results**:
- Plugin attempts to resend all messages
- Discord rate limiting may delay some resends
- No crashes or errors
- All messages eventually resent (within rate limits)

### 14. Long Message Content
**Objective**: Test with maximum length message

**Steps**:
1. Send a message with 2000 characters (Discord limit)
2. Track the message
3. Delete it
4. Verify resend

**Expected Results**:
- Long message is tracked successfully
- Full content is resent
- No truncation or errors

### 15. Special Characters and Emojis
**Objective**: Test with special content

**Steps**:
1. Send message with emojis, mentions, markdown
2. Track and delete the message
3. Verify resent content

**Expected Results**:
- Special characters preserved
- Emojis displayed correctly
- Markdown formatting maintained
- Mentions work correctly

### 16. Concurrent Deletions
**Objective**: Test multiple tracked messages deleted simultaneously

**Steps**:
1. Track 3 messages in same channel
2. Use bulk delete or rapid individual deletes
3. Observe resend behavior

**Expected Results**:
- All messages are resent
- No race conditions or errors
- Each message gets unique handling

### 17. Plugin Disable/Enable
**Objective**: Test plugin lifecycle

**Steps**:
1. Track messages
2. Disable plugin
3. Delete a tracked message
4. Re-enable plugin
5. Check if message is still tracked

**Expected Results**:
- Disable toast: "StickyMessageAutoResend has stopped!"
- No resend while disabled
- Tracked messages persist after re-enable
- Can delete and resend after re-enable

### 18. Settings Panel - Empty State
**Objective**: Verify empty state display

**Steps**:
1. Ensure no messages are tracked
2. Open plugin settings

**Expected Results**:
- Shows "No messages are currently being tracked."
- Instructions are still displayed
- No console errors

### 19. Context Menu State Update
**Objective**: Verify context menu reflects tracking state

**Steps**:
1. Right-click untracked message - should show "Track Message (Auto-Resend)"
2. Track the message
3. Right-click same message - should show "Untrack Message"
4. Untrack the message
5. Right-click again - should show "Track Message (Auto-Resend)"

**Expected Results**:
- Context menu label updates correctly based on state
- No lag or delay in state reflection

### 20. Message Ownership
**Objective**: Test tracking messages from different users

**Steps**:
1. Track your own message
2. Track a message from another user
3. Delete both messages
4. Observe resend

**Expected Results**:
- Both messages can be tracked
- Both resend successfully
- Resent messages appear as sent by you (the user running the plugin)
- Original author info is preserved in settings panel

## Edge Cases & Error Scenarios

### Edge Case 1: Plugin Loaded Without Library
**Expected**: Shows confirmation modal to download ZeresPluginLibrary

### Edge Case 2: Corrupted Save Data
**Expected**: Plugin logs error and initializes with empty tracked messages

### Edge Case 3: Message ID Collision (unlikely)
**Expected**: Handled by Map data structure

### Edge Case 4: Network Issues During Resend
**Expected**: Error caught and logged, user notified

## Performance Tests

### Performance 1: Large Number of Tracked Messages
- Track 50+ messages
- Verify no lag in UI or plugin operation

### Performance 2: Memory Usage
- Monitor memory usage with multiple tracked messages
- Should not cause significant memory leaks

### Performance 3: Startup Time
- Measure plugin initialization time
- Should load within reasonable time even with many tracked messages

## Regression Testing

After any code changes, re-run:
- Test Cases 1, 3, 4, 5, 7, 9 (core functionality)
- Any tests related to modified code areas

## Automation Possibilities

While full automation is difficult for a Discord plugin, consider:
- Unit tests for data serialization/deserialization
- Mock Discord API for testing resend logic
- Simulated event testing for deletion handling

## Sign-off Criteria

Plugin is ready for release when:
- All core test cases (1-9) pass
- No critical bugs in edge cases (10-20)
- No console errors during normal operation
- Settings panel displays correctly
- Data persists across restarts
- Context menu integration works smoothly
