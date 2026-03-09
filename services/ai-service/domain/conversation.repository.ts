import type { Conversation, ConversationWithMessages } from "./conversation.entity.js";

/**
 * Puerto de dominio: repositorio de conversaciones y mensajes.
 */
export interface IConversationRepository {
  findAll(): Promise<Conversation[]>;
  findById(id: number): Promise<ConversationWithMessages | null>;
  create(title: string): Promise<Conversation>;
  delete(id: number): Promise<void>;
  addMessage(conversationId: number, role: string, content: string): Promise<void>;
  getMessages(conversationId: number): Promise<{ role: string; content: string }[]>;
}
