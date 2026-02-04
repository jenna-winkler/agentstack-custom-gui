import { createAgentClient, type AgentClient } from "./a2aClient";
import { UIController } from "./ui";
import type { UIMessage } from "./types";
import { config } from "./config";

class ChatApp {
  private ui: UIController;
  private client: AgentClient | null = null;
  private contextId: string;

  constructor() {
    this.ui = new UIController();
    // Generate a random context ID
    this.contextId = crypto.randomUUID();
  }

  async initialize() {
    try {
      console.log("Connecting to agent...");
      // No auth needed when running with disable_auth
      this.client = await createAgentClient();

      this.ui.onSendMessage(() => this.sendMessage());

      const welcomeMessage: UIMessage = {
        id: "welcome",
        role: "agent",
        text: "Hello! I'm ready to help you. What would you like to know?",
        timestamp: new Date(),
      };
      this.ui.addMessage(welcomeMessage);

      console.log("Chat app initialized successfully!");
    } catch (error) {
      console.error("Initialization failed:", error);
      const errorMessage: UIMessage = {
        id: "error",
        role: "agent",
        text: "Failed to connect to agent. Please check your configuration.",
        timestamp: new Date(),
        metadata: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      };
      this.ui.addMessage(errorMessage);
    }
  }

  async sendMessage() {
    if (!this.client) return;

    const text = this.ui.getUserInput();
    if (!text) return;

    const userMessage: UIMessage = {
      id: Date.now().toString(),
      role: "user",
      text,
      timestamp: new Date(),
    };
    this.ui.addMessage(userMessage);
    this.ui.clearInput();
    this.ui.setInputEnabled(false);
    this.ui.addLoadingMessage();

    try {
      const stream = this.client.sendMessageStream({
        message: {
          kind: "message",
          role: "user",
          messageId: userMessage.id,
          contextId: this.contextId,
          taskId: this.ui.getTaskId(),
          parts: [{ kind: "text", text }],
          // No metadata - the A2A proxy will inject platform extension metadata
        },
      });

      for await (const event of stream) {
        console.log("Received event:", event);

        if (event.kind === "task") {
          this.ui.setTaskId(event.id);
        }

        if (event.kind === "status-update") {
          const { status } = event;
          
          // Handle errors
          if (status.state === "failed" || status.state === "rejected") {
            this.ui.removeLoadingMessage();
            
            console.error("Task failed:", status);
            console.error("Message metadata:", status.message?.metadata);
            
            const errorText = status.message?.parts
              ?.filter((p: any) => p.kind === "text")
              .map((p: any) => p.text)
              .join("\n") || "Task failed";
              
            const errorMessage: UIMessage = {
              id: Date.now().toString(),
              role: "agent",
              text: errorText || "An error occurred",
              timestamp: new Date(),
              metadata: { error: errorText },
            };
            this.ui.addMessage(errorMessage);
            continue;
          }

          // Handle successful messages
          if (status.message?.parts) {
            const textParts = status.message.parts
              .filter((p: any) => p.kind === "text")
              .map((p: any) => p.text)
              .join("\n");

            if (textParts) {
              this.ui.removeLoadingMessage();
              const agentMessage: UIMessage = {
                id: status.message.messageId || Date.now().toString(),
                role: "agent",
                text: textParts,
                timestamp: new Date(),
              };
              this.ui.addMessage(agentMessage);
            }
          }
        }
      }

      this.ui.removeLoadingMessage();
    } catch (error) {
      console.error("Error sending message:", error);
      this.ui.removeLoadingMessage();
      const errorMessage: UIMessage = {
        id: Date.now().toString(),
        role: "agent",
        text: "Sorry, something went wrong.",
        timestamp: new Date(),
        metadata: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      };
      this.ui.addMessage(errorMessage);
    } finally {
      this.ui.setInputEnabled(true);
    }
  }
}

// Start the app when DOM is ready
const startApp = () => {
  const app = new ChatApp();
  app.initialize();
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startApp);
} else {
  startApp();
}