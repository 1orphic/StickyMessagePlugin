# Click-to-Select Message Tracking Feature

## Version: 2.3.0

## Overview
This update introduces a new click-to-select feature for tracking messages, providing a more intuitive alternative to the message link method.

## What's New

### Click-to-Select Mode
Users can now enter a special selection mode to track messages by clicking on them directly, eliminating the need to copy and paste message links.

### How It Works

1. **Open the Tracking Sidebar**
   - Press `Ctrl+Shift+T` to open the tracking sidebar

2. **Enter Selection Mode**
   - Click the "🎯 Select Message to Track" button in the sidebar
   - The sidebar closes and an overlay appears over Discord

3. **Select a Message**
   - An instruction overlay appears: "🎯 Click a message to track it"
   - The chat area cursor changes to pointer to indicate clickable messages
   - Click any message in the current channel to track it
   - The message is immediately added to tracked messages

4. **Exit Selection Mode**
   - Press `Escape` to cancel without selecting
   - Selection mode automatically exits after selecting a message
   - Selection mode exits if the plugin is stopped

### Visual Feedback

#### Overlay
- Semi-transparent blue overlay (rgba(114, 137, 218, 0.1))
- Centered instruction box with:
  - Target emoji (🎯)
  - Clear instructions
  - Escape key reminder

#### Cursor
- Chat container cursor changes to `pointer` during selection mode

#### Toast Notifications
- "Click on any message to track it" when entering selection mode
- "Message is now being tracked!" on successful selection
- "This message is already being tracked" if already tracked
- Error messages if message data cannot be accessed

## Technical Implementation

### New Properties
- `selectionModeActive` (boolean): Tracks if selection mode is active
- `selectionOverlay` (HTMLElement): Reference to the overlay element
- `messageClickHandler` (function): Event handler for message clicks

### New Methods

#### `enterSelectionMode()`
- Creates semi-transparent overlay with instructions
- Attaches click handler to chat container
- Adds escape key listener
- Changes cursor to pointer
- Shows toast notification

#### `exitSelectionMode()`
- Removes overlay and event listeners
- Resets cursor
- Cleans up references
- Safe to call multiple times (idempotent)

#### `handleMessageClick(messageElement)`
- Extracts React instance from clicked element
- Navigates React Fiber tree to find message props
- Validates message data
- Tracks message if valid
- Handles errors gracefully

#### `getReactInstance(element)`
- Finds React Fiber instance from DOM element
- Looks for `__reactInternalInstance$` or `__reactFiber$` properties
- Used to access Discord's internal React data

#### `findMessageProps(fiber)`
- Traverses React Fiber tree (up to 30 levels)
- Searches for `memoizedProps.message`
- Returns message props when found
- Handles null/undefined safely

### Chat Container Selectors
The feature uses multiple selectors to find the chat container across different Discord versions:
- `[class*="messagesWrapper-"]`
- `[class*="chatContent-"]`
- `[data-list-id^="chat-messages"]`

### Message Element Selector
Messages are identified using:
- `[class*="message-"]` with `closest()` for reliable targeting

## UI Changes

### Sidebar Updates

#### New Button
- Text: "🎯 Select Message to Track"
- Full-width, secondary style button
- Hover effects for better UX
- Positioned after "OR" divider

#### Divider
- Horizontal line with centered "OR" text
- Separates link input from click-to-select button

#### Help Text
- Clear explanation: "Click this button, then click any message in the channel to track it."
- Positioned below the select button

### Updated Instructions
- Settings panel now mentions click-to-select as the primary method
- Sidebar footer updated to mention the new feature

## Benefits

### User Experience
- **More intuitive**: Direct interaction with messages
- **Faster**: No need to right-click, copy link, paste, etc.
- **More reliable**: Bypasses message link parsing issues
- **Visual feedback**: Clear indicators of selection mode
- **Error handling**: Graceful fallbacks with helpful messages

### Technical
- **Direct React access**: Gets message data directly from React components
- **No link parsing**: Eliminates link parsing failures
- **Channel-independent**: Works in any channel the user has access to
- **Robust selectors**: Multiple fallback selectors for compatibility

## Compatibility

- Works with BetterDiscord's native API
- Compatible with Discord's React structure
- Uses standard DOM APIs for maximum compatibility
- Falls back gracefully if React structure changes

## Error Handling

- Checks for element existence before accessing
- Validates React instance and props
- Provides user-friendly error messages via toasts
- Logs detailed errors to console for debugging
- Always exits selection mode on error

## Cleanup

- Proper cleanup on plugin stop
- Event listeners removed correctly
- DOM elements removed from document
- No memory leaks

## Future Enhancements

Potential improvements for future versions:
- Multi-select mode (track multiple messages at once)
- Visual highlight on hover during selection mode
- Keyboard shortcuts for selection mode (e.g., Ctrl+Click)
- Selection mode timeout with warning
- Undo last selection
- Quick toggle between selection mode and normal mode

## Testing Recommendations

1. **Basic Functionality**
   - Enter selection mode
   - Click a message
   - Verify it's tracked
   - Check auto-resend on deletion

2. **Edge Cases**
   - Click already tracked message
   - Press Escape during selection
   - Stop plugin during selection
   - Click non-message elements
   - Rapid clicks

3. **UI/UX**
   - Overlay appearance/disappearance
   - Cursor changes
   - Toast notifications
   - Button hover states
   - Sidebar close/open behavior

4. **Error Scenarios**
   - Invalid message elements
   - React structure changes
   - Missing Discord modules
   - Permission issues

## Known Limitations

1. **Current Channel Only**: Can only select messages in the currently visible channel
2. **Requires Visible Messages**: Messages must be rendered/visible to be clickable
3. **Discord Structure Dependent**: Relies on Discord's React structure (may break on Discord updates)
4. **No Multi-Select**: Can only select one message at a time

## Code Quality

- Follows existing plugin patterns
- Consistent code style
- Comprehensive error handling
- Clear method names
- Inline documentation via code structure
- No external dependencies
