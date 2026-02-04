import type { UIMessage, InputRequired } from "./types";

export class UIController {
  private messagesDiv: HTMLElement;
  private inputField: HTMLTextAreaElement;
  private sendButton: HTMLButtonElement;
  private currentTaskId?: string;
  
  constructor() {
    this.messagesDiv = document.getElementById("messages")!;
    this.inputField = document.getElementById("message-input")! as HTMLTextAreaElement;
    this.sendButton = document.getElementById("send-button")! as HTMLButtonElement;
  }
  
  addMessage(message: UIMessage) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${message.role}`;
    
    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.textContent = message.role === "user" ? "U" : "A";
    
    const contentDiv = document.createElement("div");
    contentDiv.className = "message-content";
    
    const textP = document.createElement("p");
    textP.className = "message-text";
    textP.textContent = message.text;
    contentDiv.appendChild(textP);
    
    const meta = document.createElement("div");
    meta.className = "message-meta";
    meta.textContent = message.timestamp.toLocaleTimeString();
    contentDiv.appendChild(meta);
    
    if (message.metadata?.error) {
      const errorDiv = document.createElement("div");
      errorDiv.className = "error-notification";
      errorDiv.textContent = message.metadata.error;
      contentDiv.appendChild(errorDiv);
    }
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);
    this.messagesDiv.appendChild(messageDiv);
    this.scrollToBottom();
  }
  
  addLoadingMessage() {
    const messageDiv = document.createElement("div");
    messageDiv.className = "message agent loading-message";
    messageDiv.id = "loading-message";
    
    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.textContent = "A";
    
    const contentDiv = document.createElement("div");
    contentDiv.className = "message-content";
    
    const loadingText = document.createElement("span");
    loadingText.textContent = "Agent is thinking";
    loadingText.className = "loading-dots";
    contentDiv.appendChild(loadingText);
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);
    this.messagesDiv.appendChild(messageDiv);
    this.scrollToBottom();
  }
  
  removeLoadingMessage() {
    const loading = document.getElementById("loading-message");
    if (loading) loading.remove();
  }
  
  async showForm(form: any): Promise<any> {
    return new Promise((resolve) => {
      const messageDiv = document.createElement("div");
      messageDiv.className = "message agent";
      
      const avatar = document.createElement("div");
      avatar.className = "message-avatar";
      avatar.textContent = "A";
      
      const contentDiv = document.createElement("div");
      contentDiv.className = "message-content";
      
      const formContainer = document.createElement("div");
      formContainer.className = "form-container";
      
      const title = document.createElement("h3");
      title.className = "form-title";
      title.textContent = "Please fill out this form:";
      formContainer.appendChild(title);
      
      const fields: { [key: string]: HTMLInputElement } = {};
      Object.entries(form.fields || {}).forEach(([key, field]: [string, any]) => {
        const fieldDiv = document.createElement("div");
        fieldDiv.className = "form-field";
        
        const label = document.createElement("label");
        label.textContent = field.label || key;
        fieldDiv.appendChild(label);
        
        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = field.placeholder || "";
        fields[key] = input;
        fieldDiv.appendChild(input);
        
        formContainer.appendChild(fieldDiv);
      });
      
      const actionsDiv = document.createElement("div");
      actionsDiv.className = "form-actions";
      
      const submitBtn = document.createElement("button");
      submitBtn.className = "primary";
      submitBtn.textContent = "Submit";
      submitBtn.addEventListener("click", () => {
        const values: any = {};
        Object.entries(fields).forEach(([key, input]) => {
          values[key] = input.value;
        });
        messageDiv.remove();
        resolve(values);
      });
      actionsDiv.appendChild(submitBtn);
      
      formContainer.appendChild(actionsDiv);
      contentDiv.appendChild(formContainer);
      
      messageDiv.appendChild(avatar);
      messageDiv.appendChild(contentDiv);
      this.messagesDiv.appendChild(messageDiv);
      this.scrollToBottom();
    });
  }
  
  async showApproval(request: any): Promise<string> {
    return new Promise((resolve) => {
      const messageDiv = document.createElement("div");
      messageDiv.className = "message agent";
      
      const avatar = document.createElement("div");
      avatar.className = "message-avatar";
      avatar.textContent = "A";
      
      const contentDiv = document.createElement("div");
      contentDiv.className = "message-content";
      
      const approvalContainer = document.createElement("div");
      approvalContainer.className = "approval-container";
      
      const title = document.createElement("h3");
      title.className = "approval-title";
      title.textContent = "Approval Required";
      approvalContainer.appendChild(title);
      
      const description = document.createElement("p");
      description.className = "approval-description";
      description.textContent = request.description || "The agent needs your approval to continue.";
      approvalContainer.appendChild(description);
      
      const actionsDiv = document.createElement("div");
      actionsDiv.className = "approval-actions";
      
      const approveBtn = document.createElement("button");
      approveBtn.className = "approve";
      approveBtn.textContent = "Approve";
      approveBtn.addEventListener("click", () => {
        messageDiv.remove();
        resolve("approve");
      });
      actionsDiv.appendChild(approveBtn);
      
      const denyBtn = document.createElement("button");
      denyBtn.className = "deny";
      denyBtn.textContent = "Deny";
      denyBtn.addEventListener("click", () => {
        messageDiv.remove();
        resolve("deny");
      });
      actionsDiv.appendChild(denyBtn);
      
      approvalContainer.appendChild(actionsDiv);
      contentDiv.appendChild(approvalContainer);
      
      messageDiv.appendChild(avatar);
      messageDiv.appendChild(contentDiv);
      this.messagesDiv.appendChild(messageDiv);
      this.scrollToBottom();
    });
  }
  
  getUserInput(): string {
    return this.inputField.value.trim();
  }
  
  clearInput() {
    this.inputField.value = "";
  }
  
  setInputEnabled(enabled: boolean) {
    this.inputField.disabled = !enabled;
    this.sendButton.disabled = !enabled;
  }
  
  setTaskId(taskId?: string) {
    this.currentTaskId = taskId;
  }
  
  getTaskId(): string | undefined {
    return this.currentTaskId;
  }
  
  onSendMessage(callback: () => void) {
    this.sendButton.addEventListener("click", callback);
    this.inputField.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        callback();
      }
    });
  }
  
  private scrollToBottom() {
    this.messagesDiv.scrollTop = this.messagesDiv.scrollHeight;
  }
}