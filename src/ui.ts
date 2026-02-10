import { ApprovalDecision, ApprovalRequest, FormField, FormFieldValue, FormRender, FormValues } from "agentstack-sdk";
import { uploadFilesToContext } from "./api";
import type { UIMessage } from "./types";
import { createElement, createFieldElement, getErrorMessage } from "./utils";

export class UIController {
  private messagesElement: HTMLElement;
  private messageInputElement: HTMLTextAreaElement;
  private sendButtonElement: HTMLButtonElement;

  constructor() {
    this.messagesElement = document.getElementById("messages")! as HTMLDivElement;
    this.messageInputElement = document.getElementById("message-input")! as HTMLTextAreaElement;
    this.sendButtonElement = document.getElementById("send-button")! as HTMLButtonElement;
  }

  addMessage(message: UIMessage) {
    const messageElement = createElement({
      tagName: "div",
      classes: ["message", message.role],
    });

    const avatarElement = createElement({
      tagName: "div",
      classes: ["message-avatar"],
      content: message.role === "user" ? "U" : "A",
    });

    const contentElement = createElement({
      tagName: "div",
      classes: ["message-content"],
    });

    const textElement = createElement({
      tagName: "p",
      classes: ["message-text"],
      content: message.text,
    });

    const metaElement = createElement({
      tagName: "div",
      classes: ["message-meta"],
      content: message.timestamp.toLocaleTimeString(),
    });

    contentElement.appendChild(textElement);
    contentElement.appendChild(metaElement);

    const error = message.metadata?.error;

    if (error) {
      const errorElement = createElement({
        tagName: "div",
        classes: ["error-notification"],
        content: error,
      });

      contentElement.appendChild(errorElement);
    }

    messageElement.appendChild(avatarElement);
    messageElement.appendChild(contentElement);

    this.messagesElement.appendChild(messageElement);
    this.scrollToBottom();
  }

  addLoadingMessage() {
    const messageElement = createElement({
      tagName: "div",
      classes: ["message", "agent", "loading-message"],
      id: "loading-message",
    });

    const avatarElement = createElement({
      tagName: "div",
      classes: ["message-avatar"],
      content: "A",
    });

    const contentElement = createElement({
      tagName: "div",
      classes: ["message-content"],
    });

    const loadingElement = createElement({
      tagName: "span",
      classes: ["loading-dots"],
      content: "Agent is thinking",
    });

    contentElement.appendChild(loadingElement);
    messageElement.appendChild(avatarElement);
    messageElement.appendChild(contentElement);

    this.messagesElement.appendChild(messageElement);
    this.scrollToBottom();
  }

  removeLoadingMessage() {
    const loading = document.getElementById("loading-message");

    if (loading) {
      loading.remove();
    }
  }

  async showForm(form: FormRender, { contextId }: { contextId?: string } = {}): Promise<FormValues> {
    return new Promise((resolve) => {
      const messageElement = createElement({
        tagName: "div",
        classes: ["message", "agent"],
      });

      const avatarElement = createElement({
        tagName: "div",
        classes: ["message-avatar"],
        content: "A",
      });

      const contentElement = createElement({
        tagName: "div",
        classes: ["message-content"],
      });

      const containerElement = createElement({
        tagName: "div",
        classes: ["form-container"],
      });

      const titleElement = createElement({
        tagName: "h3",
        classes: ["form-title"],
        content: "Please fill out this form:",
      });

      containerElement.appendChild(titleElement);

      const fields: Record<
        string,
        {
          type: FormField["type"];
          element: ReturnType<typeof createFieldElement>;
        }
      > = {};

      form.fields.forEach((field) => {
        const fieldElement = createElement({
          tagName: "div",
          classes: ["form-field"],
        });

        const labelElement = createElement({
          tagName: "label",
          content: field.label,
        });

        fieldElement.appendChild(labelElement);

        const inputElement = createFieldElement(field);

        fields[field.id] = {
          type: field.type,
          element: inputElement,
        };

        fieldElement.appendChild(inputElement);
        containerElement.appendChild(fieldElement);
      });

      const actionsElement = createElement({
        tagName: "div",
        classes: ["form-actions"],
      });

      const submitElement = createElement({
        tagName: "button",
        classes: ["primary"],
        content: "Submit",
      });

      const formErrorElement = createElement({
        tagName: "div",
        classes: ["error-notification", "is-hidden"],
      });

      containerElement.appendChild(formErrorElement);

      submitElement.addEventListener("click", async () => {
        submitElement.disabled = true;
        formErrorElement.classList.add("is-hidden");

        try {
          const values: FormValues = {};

          for (const [key, { type, element }] of Object.entries(fields)) {
            let fieldValue: FormFieldValue | undefined = undefined;

            if (element instanceof HTMLInputElement) {
              switch (type) {
                case "checkbox":
                  fieldValue = {
                    type,
                    value: element.checked,
                  };

                  break;
                case "text":
                case "date":
                  fieldValue = {
                    type,
                    value: element.value,
                  };

                  break;
                case "file": {
                  const files = Array.from(element.files ?? []);
                  const hasFiles = files.length > 0;

                  if (!contextId) {
                    throw new Error("Unable to submit files: context is not initialized.");
                  }

                  fieldValue = {
                    type,
                    value: hasFiles ? await uploadFilesToContext({ files, contextId }) : null,
                  };

                  break;
                }
              }
            } else if (element instanceof HTMLSelectElement) {
              switch (type) {
                case "singleselect":
                  fieldValue = {
                    type,
                    value: element.value,
                  };

                  break;
                case "multiselect":
                  fieldValue = {
                    type,
                    value: Array.from(element.selectedOptions).map(({ value }) => value),
                  };

                  break;
              }
            }

            if (fieldValue) {
              values[key] = fieldValue;
            }
          }

          messageElement.remove();

          resolve(values);
        } catch (error) {
          console.error("Failed to submit form:", error);

          formErrorElement.classList.remove("is-hidden");
          formErrorElement.textContent = getErrorMessage(error, "Failed to submit form.");
        } finally {
          submitElement.disabled = false;
        }
      });

      actionsElement.appendChild(submitElement);
      containerElement.appendChild(actionsElement);
      contentElement.appendChild(containerElement);
      messageElement.appendChild(avatarElement);
      messageElement.appendChild(contentElement);

      this.messagesElement.appendChild(messageElement);
      this.scrollToBottom();
    });
  }

  async showApproval(request: ApprovalRequest): Promise<ApprovalDecision> {
    return new Promise((resolve) => {
      const messageElement = createElement({
        tagName: "div",
        classes: ["message", "agent"],
      });

      const avatarElement = createElement({
        tagName: "div",
        classes: ["message-avatar"],
        content: "A",
      });

      const contentElement = createElement({
        tagName: "div",
        classes: ["message-content"],
      });

      const approvalContainerElement = createElement({
        tagName: "div",
        classes: ["approval-container"],
      });

      const titleElement = createElement({
        tagName: "h3",
        classes: ["approval-title"],
        content: "Approval Required",
      });

      const descriptionElement = createElement({
        tagName: "p",
        classes: ["approval-description"],
        content: request.description || "The agent needs your approval to continue.",
      });

      const actionsElement = createElement({
        tagName: "div",
        classes: ["approval-actions"],
      });

      const approveElement = createElement({
        tagName: "button",
        classes: ["approve"],
        content: "Approve",
      });

      approveElement.addEventListener("click", () => {
        messageElement.remove();

        resolve(ApprovalDecision.Approve);
      });

      const rejectElement = createElement({
        tagName: "button",
        classes: ["reject"],
        content: "Reject",
      });

      rejectElement.addEventListener("click", () => {
        messageElement.remove();

        resolve(ApprovalDecision.Reject);
      });

      approvalContainerElement.appendChild(titleElement);
      approvalContainerElement.appendChild(descriptionElement);
      actionsElement.appendChild(approveElement);
      actionsElement.appendChild(rejectElement);
      approvalContainerElement.appendChild(actionsElement);
      contentElement.appendChild(approvalContainerElement);
      messageElement.appendChild(avatarElement);
      messageElement.appendChild(contentElement);

      this.messagesElement.appendChild(messageElement);
      this.scrollToBottom();
    });
  }

  getUserInput(): string {
    return this.messageInputElement.value.trim();
  }

  clearInput() {
    this.messageInputElement.value = "";
  }

  setInputEnabled(enabled: boolean) {
    this.messageInputElement.disabled = !enabled;
    this.sendButtonElement.disabled = !enabled;
  }

  onSendMessage(callback: () => void) {
    this.sendButtonElement.addEventListener("click", callback);
    this.messageInputElement.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        callback();
      }
    });
  }

  private scrollToBottom() {
    this.messagesElement.scrollTop = this.messagesElement.scrollHeight;
  }
}
