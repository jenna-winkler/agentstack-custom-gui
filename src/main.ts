import { handleTaskStatusUpdate, resolveUserMetadata, TaskStatusUpdateType, UserMetadataInputs } from "agentstack-sdk";
import { createAgentClient, type AgentClient } from "./a2aClient";
import { UIController } from "./ui";
import { createUiMessage, getErrorMessage, getTextFromParts } from "./utils";
import { TERMINAL_TASK_STATES } from "./constants";

class ChatApp {
  private ui: UIController;
  private inputRequired: boolean;
  private client?: AgentClient;
  private contextId?: string;
  private taskId?: string;

  constructor() {
    this.ui = new UIController();
    this.inputRequired = false;
  }

  async initialize() {
    try {
      console.log("Connecting to agent...");

      const { client, context } = await createAgentClient();

      this.client = client;
      this.contextId = context.id;

      this.ui.onSendMessage(() => this.sendMessage());

      const welcomeMessage = createUiMessage({
        role: "agent",
        text: "Hello! I'm ready to help you. What would you like to know?",
      });

      this.ui.addMessage(welcomeMessage);

      console.log("Chat app initialized successfully!");
    } catch (error) {
      console.error("Initialization failed:", error);

      const errorMessage = createUiMessage({
        role: "agent",
        text: "Failed to connect to agent. Please check your configuration.",
        metadata: {
          error: getErrorMessage(error),
        },
      });

      this.ui.addMessage(errorMessage);
    }
  }

  async sendMessage({ text: textParam, userInput }: { text?: string; userInput?: UserMetadataInputs } = {}) {
    if (!this.client) {
      return;
    }

    const text = textParam || this.ui.getUserInput();

    const userMessage = createUiMessage({
      role: "user",
      text,
    });

    if (text) {
      this.ui.addMessage(userMessage);
    }

    this.ui.clearInput();
    this.ui.setInputEnabled(false);
    this.ui.addLoadingMessage();

    const userMetadata = userInput ? await resolveUserMetadata(userInput) : {};

    try {
      const stream = this.client.sendMessageStream({
        message: {
          kind: "message",
          role: "user",
          messageId: userMessage.id,
          contextId: this.contextId,
          taskId: this.taskId,
          parts: text
            ? [
                {
                  kind: "text",
                  text,
                },
              ]
            : [],
          metadata: userMetadata,
        },
      });

      for await (const event of stream) {
        console.log("Received event:", event);

        if (event.kind === "task") {
          this.setTaskId(event.id);
        }

        if (event.kind === "status-update") {
          const { status, taskId } = event;

          this.setTaskId(taskId);

          this.inputRequired = status.state === "input-required";

          // Handle errors
          if (status.state === "failed" || status.state === "rejected") {
            this.ui.removeLoadingMessage();

            console.error("Task failed:", status);
            console.error("Message metadata:", status.message?.metadata);

            const errorText = getTextFromParts(status.message?.parts) || "Task failed";

            const errorMessage = createUiMessage({
              role: "agent",
              text: errorText,
              metadata: {
                error: errorText,
              },
            });

            this.ui.addMessage(errorMessage);

            // Handle successful messages
          } else {
            const { message } = status;

            if (message) {
              const text = getTextFromParts(message.parts);

              if (text) {
                this.ui.removeLoadingMessage();

                const agentMessage = createUiMessage({
                  id: message.messageId,
                  role: "agent",
                  text,
                });

                this.ui.addMessage(agentMessage);
              }
            }

            handleTaskStatusUpdate(event).forEach(async (result) => {
              switch (result.type) {
                case TaskStatusUpdateType.FormRequired:
                  const values = await this.ui.showForm(result.form, {
                    contextId: this.contextId,
                  });

                  this.sendMessage({
                    text: JSON.stringify(values, null, 2),
                    userInput: {
                      form: values,
                    },
                  });

                  break;
                case TaskStatusUpdateType.ApprovalRequired:
                  const approval = await this.ui.showApproval(result.request);

                  this.sendMessage({
                    text: approval,
                    userInput: {
                      approvalResponse: {
                        decision: approval,
                      },
                    },
                  });

                  break;
                default:
                  break;
              }
            });
          }

          if (TERMINAL_TASK_STATES.has(status.state)) {
            this.setTaskId(undefined);
          }
        }
      }

      this.ui.removeLoadingMessage();
    } catch (error) {
      console.error("Error sending message:", error);

      this.ui.removeLoadingMessage();

      const errorMessage = createUiMessage({
        role: "agent",
        text: "Sorry, something went wrong.",
        metadata: {
          error: getErrorMessage(error),
        },
      });

      this.ui.addMessage(errorMessage);
    } finally {
      if (!this.inputRequired) {
        this.ui.setInputEnabled(true);
      }
    }
  }

  setTaskId(taskId?: string) {
    this.taskId = taskId;
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
