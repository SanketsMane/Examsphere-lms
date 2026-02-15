import { BaseService } from "./BaseService";
import { ApiResponse } from "../types";

/**
 * AI API Service
 * Sanket
 */

export interface AiMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AiConversation {
  id: string;
  title: string;
  updatedAt: string;
}

export class AiService extends BaseService {
  static getConversations() {
    return this.get<AiConversation[]>("/api/ai/conversations");
  }

  static createConversation(title?: string) {
    return this.post<AiConversation>("/api/ai/conversations", { title });
  }

  static getConversation(conversationId: string) {
    return this.get<AiConversation & { messages: AiMessage[] }>(`/api/ai/conversations/${conversationId}`);
  }

  static sendMessage(messages: AiMessage[], conversationId?: string) {
    return this.post<AiMessage>("/api/ai/chat", { messages, conversationId });
  }
}

export const aiService = AiService;
