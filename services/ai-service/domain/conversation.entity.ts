/**
 * Entidades de dominio: Conversation y Message (Bounded Context: AI Assistant).
 */
export interface Conversation {
  id: number;
  title: string;
  createdAt: string;
}

export interface Message {
  id: number;
  conversationId: number;
  role: string;
  content: string;
  createdAt: string;
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}
