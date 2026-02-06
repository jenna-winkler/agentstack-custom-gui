export interface UIMessage {
  id: string;
  role: "user" | "agent";
  text: string;
  timestamp: Date;
  metadata?: {
    error?: string;
  };
}

export interface InputRequired {
  type: "form" | "approval";
  data: unknown;
}
