# Test Checklist for v4.0.1

## Prerequisites
- [ ] BetterDiscord installed and working
- [ ] Developer Mode enabled in Discord Settings → Advanced
- [ ] Plugin file placed in BetterDiscord plugins folder

## Test Cases

### 1. Plugin Loading
- [ ] Plugin loads without errors in BetterDiscord plugins list
- [ ] No console errors on Discord startup
- [ ] Success toast appears: "StickyMessageAutoResend started!"

### 2. Store Finding (Core Fix)
- [ ] Open plugin settings
- [ ] Paste a valid message ID
- [ ] Click "Track Message"
- [ ] **Expected**: Success toast "Message tracked! It will auto-resend if deleted."
- [ ] **Not Expected**: "Required stores not found" error ❌

### 3. Message Tracking
- [ ] Open a Discord channel
- [ ] Right-click any message → Copy Message ID
- [ ] Open plugin settings
- [ ] Paste the message ID
- [ ] Click "Track Message"
- [ ] **Expected**: 
  - Success notification
  - Settings panel refreshes
  - Status shows "✓ Tracking a message"
  - Channel name displays correctly
  - Message content preview shows
  - Message ID displays

### 4. Auto-Resend Functionality
- [ ] Track a message you sent (so you can delete it)
- [ ] Delete the tracked message
- [ ] **Expected**:
  - Message automatically resends after ~500ms
  - Success toast: "Tracked message resent!"
  - New message appears in channel
  - Plugin updates to track the new message

### 5. Message Untracking
- [ ] Track any message
- [ ] Open plugin settings
- [ ] Click "Untrack Message"
- [ ] **Expected**:
  - Info toast: "Message untracked."
  - Settings panel refreshes
  - Status shows "No message is currently being tracked."
  - Track section becomes visible again

### 6. Error Handling

#### 6a. Invalid Message ID
- [ ] Enter random text/numbers as message ID
- [ ] Click "Track Message"
- [ ] **Expected**: Error toast with helpful message

#### 6b. Empty Input
- [ ] Leave message ID field empty
- [ ] Click "Track Message"
- [ ] **Expected**: Error toast "Please enter a message ID"

#### 6c. Wrong Channel
- [ ] Copy message ID from one channel
- [ ] Navigate to a different channel
- [ ] Try to track the message
- [ ] **Expected**: Error "Message not found. Make sure the ID is correct and you're in the right channel."

### 7. Plugin Lifecycle
- [ ] Enable plugin → verify it starts
- [ ] Disable plugin → verify it stops cleanly
- [ ] Re-enable plugin → verify tracked message persists
- [ ] Restart Discord → verify tracked message persists

### 8. Console Logging
- [ ] Open DevTools console (Ctrl+Shift+I)
- [ ] Perform various actions
- [ ] **Expected**: Clear, prefixed log messages `[StickyMessageAutoResend]`
- [ ] **Not Expected**: Uncaught errors or warnings about missing modules

### 9. Module Finding (Technical Verification)
- [ ] Open DevTools console before enabling plugin
- [ ] Enable plugin
- [ ] Check console for module finding logs
- [ ] **Expected**: No warnings about "Filters API not available" (or they're just warnings, not errors)
- [ ] **Expected**: All 4 finder methods can locate their respective modules

### 10. Edge Cases

#### 10a. Message with no text content
- [ ] Track an image-only message or message with just emoji
- [ ] Delete it
- [ ] **Expected**: Plugin handles gracefully (may show empty content)

#### 10b. Very long message
- [ ] Track a message with 2000 characters
- [ ] Verify it displays correctly in settings (truncated with "...")
- [ ] Delete and verify it resends completely

#### 10c. Channel deletion
- [ ] Track a message
- [ ] Delete the entire channel (if you have permission)
- [ ] **Expected**: Plugin handles gracefully, shows "Unknown Channel"

## Performance Checks
- [ ] Plugin loads quickly (< 1 second)
- [ ] No noticeable lag when tracking messages
- [ ] No memory leaks after multiple track/untrack cycles
- [ ] No excessive console logging during normal operation

## Regression Tests (Ensure nothing broke)
- [ ] All v4.0.0 features still work
- [ ] Settings panel UI looks correct
- [ ] Data persistence still works
- [ ] Toast notifications still appear
- [ ] Message delete listener still works

## Success Criteria
✅ All test cases pass
✅ No "Required stores not found" error
✅ Plugin works reliably across different Discord versions
✅ No console errors or warnings
✅ User experience is smooth and intuitive

## Failed Test Actions
If any test fails:
1. Note which test failed
2. Check console for errors
3. Note Discord version (Help → "Copy Debug Info")
4. Try reloading Discord
5. Report findings with console logs
