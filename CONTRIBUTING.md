# Contributing to Sticky Message Auto-Resend Plugin

Thank you for your interest in contributing to this BetterDiscord plugin! This document provides guidelines and instructions for contributing.

## Getting Started

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/yourusername/sticky-message-auto-resend.git
   cd sticky-message-auto-resend
   ```
3. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Setup

### Prerequisites
- [BetterDiscord](https://betterdiscord.app/) installed
- Text editor or IDE (VS Code recommended)
- Basic knowledge of JavaScript and Discord's API

### Plugin Development Workflow

1. **Edit the plugin**
   - Make changes to `StickyMessageAutoResend.plugin.js`
   
2. **Test locally**
   - Copy the plugin to your BetterDiscord plugins folder
   - Reload Discord or reload plugins (Ctrl+R)
   - Test your changes thoroughly

3. **Check for errors**
   - Open Discord DevTools (Ctrl+Shift+I)
   - Look for any console errors or warnings

## Code Style Guidelines

### JavaScript Style
- Use ES6+ features (arrow functions, async/await, etc.)
- Use `const` and `let` instead of `var`
- Use meaningful variable and function names
- Add comments for complex logic

### BetterDiscord Conventions
- Follow the plugin structure with meta header
- Use BdApi for Discord operations
- Use BetterDiscord native API only
- Handle errors gracefully with try-catch blocks
- Show user-friendly notifications using BdApi.UI.showToast

### Example Code Style
```javascript
async resendMessage(messageData) {
    try {
        const ChannelStore = BdApi.Webpack.getModule(
            m => m?.getChannel && m?.hasChannel
        );
        const channel = ChannelStore.getChannel(messageData.channelId);
        
        if (!channel) {
            BdApi.UI.showToast("Cannot resend message: Channel not found", { type: "error" });
            return;
        }

        // Send the message
        const MessageActions = BdApi.Webpack.getModule(
            m => m?.sendMessage && m?.receiveMessage
        );
        MessageActions.sendMessage(messageData.channelId, {
            content: messageData.content || ""
        });
        
        BdApi.UI.showToast("Message resent!", { type: "success" });
    } catch (error) {
        console.error("Failed to resend:", error);
        BdApi.UI.showToast("Failed to resend message", { type: "error" });
    }
}
```

## Testing

### Manual Testing
Before submitting a pull request:
1. Test all core functionality (see TEST_PLAN.md)
2. Test edge cases
3. Verify no console errors
4. Test on clean Discord install if possible

### Test Checklist
- [ ] Plugin loads without errors
- [ ] Can track messages via context menu
- [ ] Tracked messages are resent when deleted
- [ ] Can untrack messages
- [ ] Settings panel displays correctly
- [ ] Data persists across restarts
- [ ] No memory leaks
- [ ] Works with different message types

## Submitting Changes

### Pull Request Process

1. **Update documentation**
   - Update README.md if adding features
   - Update USAGE_EXAMPLE.md with new examples
   - Update TEST_PLAN.md with new test cases

2. **Update version and changelog**
   - Bump version in plugin meta header
   - Add entry to changelog in plugin config

3. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

4. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Select your fork and branch
   - Fill in the PR template

### Commit Message Format

Use conventional commit format:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Test additions or changes
- `chore:` - Maintenance tasks

Examples:
```
feat: add support for message attachments
fix: prevent duplicate resends
docs: update installation instructions
refactor: simplify message tracking logic
```

### Pull Request Template

When creating a PR, include:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Code refactoring

## Testing
- [ ] Tested locally
- [ ] All core features work
- [ ] No console errors
- [ ] Edge cases handled

## Screenshots (if applicable)
Add screenshots here

## Checklist
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] Version bumped
- [ ] Changelog updated
```

## Feature Requests

### Before Requesting
1. Check existing issues and PRs
2. Ensure it fits the plugin's scope
3. Consider if it can be a separate plugin

### Creating a Feature Request
Use the issue template and include:
- Clear description of the feature
- Use cases and examples
- Mockups or diagrams if applicable
- Potential implementation approach

## Bug Reports

### Before Reporting
1. Check if it's already reported
2. Try to reproduce on clean install
3. Check BetterDiscord and library versions

### Creating a Bug Report
Include:
- Plugin version
- BetterDiscord version
- Steps to reproduce
- Expected vs actual behavior
- Console errors (if any)
- Screenshots or recordings

## Code Review Process

### What We Look For
- Code quality and readability
- Proper error handling
- Performance considerations
- User experience
- Documentation completeness

### Review Timeline
- Initial review within 1-2 weeks
- Feedback provided as comments
- Changes requested if needed
- Merge when approved

## Plugin Architecture

### Core Components

1. **Message Tracking**
   - `trackMessage()` - Stores message data
   - `untrackMessage()` - Removes tracking
   - `trackedMessages` Map - Stores tracked data

2. **Event Handling**
   - `startMessageDeleteListener()` - Subscribes to events
   - `handleMessageDelete()` - Processes deletions
   - `stopMessageDeleteListener()` - Cleanup

3. **Message Operations**
   - `resendMessage()` - Resends tracked message
   - `waitForNewMessage()` - Waits for confirmation

4. **UI Components**
   - `patchContextMenu()` - Adds menu items
   - `getSettingsPanel()` - Creates settings UI

5. **Data Persistence**
   - `loadSettings()` - Loads saved data
   - `saveSettings()` - Persists to storage

### Adding New Features

When adding features, consider:
- Where it fits in the architecture
- Impact on existing features
- Performance implications
- User configuration needs
- Error handling requirements

## Getting Help

- **Discord API**: [Discord Developer Portal](https://discord.com/developers/docs)
- **BetterDiscord**: [BetterDiscord Docs](https://docs.betterdiscord.app/)

## Community

- Be respectful and constructive
- Help others when you can
- Share knowledge and tips
- Report issues professionally

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

Thank you for contributing! 🎉
