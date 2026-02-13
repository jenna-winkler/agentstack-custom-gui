# Agent Stack Chat UI

A web-based chat interface for Agent Stack backends. This is a standalone UI that connects to your Agent Stack API server and provides a chat experience where agents can ask for user input through forms, request approvals, and handle file uploads.

## Features

- Stream chat messages between users and agents via the A2A protocol
- Render dynamic forms when agents need structured input (text, dates, checkboxes, file uploads, dropdowns)
- Handle approval requests where agents need user confirmation to proceed
- Upload files with proper context management
- Built with TypeScript and Vite for fast development

## Architecture

### Core Components

- **ChatApp** (`src/main.ts`): Main application orchestrator that manages message flow and agent communication
- **UIController** (`src/ui.ts`): Handles all DOM interactions, form rendering, and approval dialogs
- **A2A Client** (`src/a2aClient.ts`): Configures and creates Agent-to-Agent protocol clients
- **API Layer** (`src/api.ts`): Manages Agent Stack API interactions (contexts, tokens, file uploads)

### Key Technologies

- **TypeScript**: Type-safe development with strict mode enabled
- **Vite**: Fast development server with HMR and optimized production builds
- **AgentStack SDK**: Official SDK for Agent Stack integration (`agentstack-sdk@0.6.1-rc1`)
- **A2A Protocol**: Agent-to-Agent communication via `@a2a-js/sdk`
- **Carbon Design**: IBM Carbon-inspired styling for enterprise-grade UX

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- pnpm (v9.9.0+) or npm
- An Agent Stack backend running on `localhost:8333` (or configure in `src/config.ts`)

### Installation

```bash
# Install dependencies
pnpm install

# Or with npm
npm install
```

### Configuration

Update the provider ID in `src/config.ts`:

```typescript
export const config = {
  baseUrl: window.location.origin,
  providerId: "your-provider-id-here", // Replace with your Agent Stack provider ID
};
```

### Development

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

The development server will start at `http://localhost:5173` with proxy configuration for `/api` endpoints to `localhost:8333`.

## Usage

### Basic Chat

1. Open the application in your browser
2. Type a message in the input field
3. Press Enter or click "Send"
4. The agent will respond with streaming messages

### Form Submissions

When an agent requests information via a form:

1. A form will appear in the chat interface
2. Fill out the required fields (supports text, date, checkbox, file, single/multi-select)
3. Click "Submit" to send the form data back to the agent
4. The agent will process your input and continue the conversation

### Approval Workflows

When an agent requires approval:

1. An approval request will appear with a description
2. Review the request details
3. Click "Approve" to continue or "Reject" to deny
4. The agent will respond based on your decision

## Project Structure

```
agentstack-custom-gui/
├── src/
│   ├── main.ts           # Application entry point & ChatApp class
│   ├── ui.ts             # UI controller for DOM manipulation
│   ├── a2aClient.ts      # A2A client factory
│   ├── api.ts            # Agent Stack API client
│   ├── config.ts         # Configuration (provider ID, base URL)
│   ├── types.ts          # TypeScript type definitions
│   ├── utils.ts          # Utility functions (DOM, parsing, errors)
│   └── constants.ts      # Application constants
├── index.html            # Main HTML file with embedded styles
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── vite.config.js        # Vite configuration with proxy
└── .gitignore           # Git ignore rules
```

## API Integration

### Context Management

The application automatically creates and manages Agent Stack contexts:

```typescript
// Create a new context
const context = await createContext();

// Generate a context token with permissions
const token = await createContextToken(context.id);
```

### Message Streaming

Messages are sent and received via streaming:

```typescript
const stream = client.sendMessageStream({
  message: {
    kind: "message",
    role: "user",
    messageId: uniqueId,
    contextId: context.id,
    taskId: currentTask.id,
    parts: [{ kind: "text", text: "User message" }],
    metadata: {},
  },
});

for await (const event of stream) {
  // Handle task, status-update, and message events
}
```

### File Uploads

Files are uploaded to the Agent Stack context:

```typescript
const files = await uploadFilesToContext({
  contextId: context.id,
  files: fileList,
});
```

## Supported Form Field Types

- **text**: Single-line text input with optional placeholder
- **date**: Date picker
- **checkbox**: Boolean checkbox
- **file**: File upload with MIME type filtering
- **singleselect**: Dropdown with single selection
- **multiselect**: Multi-select dropdown

## Task States

The application tracks task lifecycle states:

- `pending`: Task created but not started
- `in-progress`: Task is actively running
- `input-required`: Waiting for user input (form/approval)
- `completed`: Task finished successfully
- `failed`: Task encountered an error
- `rejected`: Task was rejected by user
- `canceled`: Task was canceled

## Error Handling

Errors are displayed inline with messages and include:

- Connection failures
- API errors
- Form submission errors
- Task execution failures

## Development Proxy

The Vite development server proxies `/api` requests to `localhost:8333`, allowing seamless integration with a local Agent Stack backend during development.

## Browser Support

Modern browsers with ES2020+ support:

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+