# WebChat Widget

A standalone, embeddable chat widget that can be integrated into any website. The widget provides real-time messaging capabilities with WebSocket support and automatic conversation persistence.

## Features

- 🚀 **Standalone Script** - Embeddable via a single script tag
- 💬 **Real-time Chat** - WebSocket-based messaging with Socket.IO
- 💾 **Conversation Persistence** - Automatic conversation storage in localStorage
- 🎨 **Customizable UI** - Configurable themes, colors, and appearance
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 🔒 **Session Management** - UUID-based session tracking
- ⚡ **TypeScript** - Built with TypeScript for type safety

## Quick Start

### Installation

Include the webchat widget in your HTML:

```html
<script src="https://github.com/ali3nnn/WebchatWidget/releases/latest/download/webchat.js"></script>
<script>
  initWebchat("http://localhost:3000/endpoints/your-endpoint-id");
</script>
```

### Configuration

The widget fetches configuration from your endpoint, expecting a JSON response like:

```json
{
  "flow": "your-flow-name",
  "chatbotName": "Your Bot Name",
  "chatbotAvatar": "https://api.dicebear.com/7.x/bottts/svg?seed=bot",
  "userAvatar": "https://api.dicebear.com/7.x/bottts/svg?seed=user",
  "colors": {
    "header": "#667eea",
    "message": {
      "user": "#667eea",
      "bot": "#4a5568"
    }
  },
  "inputFieldMessage": "Type your message...",
  "sendButton": "Send",
  "chatBubbleTheme": "theme-chatbubble-modern",
  "chatContainerTheme": "theme-container-modern",
  "enableJumpAnimation": false,
  "enableTypingEffect": false,
  "additionalInput": false
}
```

## Development

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Setup

```bash
# Clone the repository
git clone https://github.com/ali3nnn/WebchatWidget.git
cd WebchatWidget

# Install dependencies
npm install

# Build the widget
npm run build

# Watch for changes during development
npm run watch
```

### Project Structure

```
src/
├── webchat.ts              # Main entry point
├── style.css              # Widget styles
└── modules/
    ├── ChatUIBuilder.ts    # UI construction and management
    ├── SocketManager.ts    # WebSocket connection handling
    ├── MessageQueueManager.ts  # Message processing and display
    ├── EventHandlers.ts    # Event handling logic
    ├── interfaces.ts       # TypeScript interfaces
    ├── utils.ts           # Utility functions and session management
    └── constants.ts       # SVG assets and constants
```

## API Reference

### Global Functions

- `window.initWebchat(endpointUrl)` - Initialize the webchat widget
- `window.webchatConversation.getSessionId()` - Get current session ID
- `window.webchatConversation.getConversation()` - View conversation history
- `window.webchatConversation.clearConversation()` - Clear conversation and UI
- `window.webchatConversation.exportConversation()` - Export conversation as JSON

### Message Format

The widget expects and sends messages in this format:

```json
{
  "text": "Hello!",
  "source": "user" | "bot",
  "data": {},
  "metadata": {
    "timestamp": "2025-08-30T12:34:56Z",
    "chatbotName": "Bot Name",
    "chatbotAvatar": "avatar-url"
  }
}
```

## Creating a Release

Releases are automatically created by the CI/CD pipeline when you push a new git tag.

### Release Process

1. **Prepare the Release**
   - Ensure all changes are committed and pushed to the main branch
   - Update the version in `package.json` if needed
   - Test your changes locally

2. **Create and Push the Git Tag**
   ```bash
   # Create a new tag (replace v2.0.0 with your desired version)
   git tag v2.0.0
   
   # Push the tag to GitHub
   git push origin v2.0.0
   ```

3. **Automatic Pipeline Execution**
   - The CI/CD pipeline automatically triggers when the tag is pushed
   - The pipeline will build the project and create a GitHub release
   - The built `webchat.js` file will be automatically attached to the release

### Version Naming Convention

Use semantic versioning (SemVer):

- `v1.0.0` - Major release (breaking changes)
- `v1.1.0` - Minor release (new features, backward compatible)
- `v1.0.1` - Patch release (bug fixes)

### Example Release Workflow

```bash
# Make your changes
git add .
git commit -m "Add conversation persistence feature"
git push origin main

# Create and push release tag
git tag v2.0.0
git push origin v2.0.0

# The CI/CD pipeline will automatically:
# - Build the project
# - Create a GitHub release
# - Attach the built webchat.js file
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes and commit: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions, please create an issue in the GitHub repository.
