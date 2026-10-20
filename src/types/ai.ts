export type ChatRole = "user" | "ai";

export interface ChatMessage {
  role: ChatRole;
  text: string;
  code?: string;
}

export interface AIRepairRequest {
  filename: string;
  brokenCode: string;
  compilerLogs: string;
}

export interface AIRepairResponse {
  suggestion: string;
  fixedCode?: string;
}
