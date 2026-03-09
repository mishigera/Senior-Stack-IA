import type { Pool } from "pg";
import type { IConversationRepository } from "../../domain/conversation.repository.js";
import type { Conversation, ConversationWithMessages } from "../../domain/conversation.entity.js";

export class ConversationPgRepository implements IConversationRepository {
  constructor(private readonly pool: Pool) {}

  async findAll(): Promise<Conversation[]> {
    const result = await this.pool.query<{ id: number; title: string; createdAt: string }>(
      `SELECT id, title, created_at AS "createdAt" FROM conversations ORDER BY created_at DESC`,
    );
    return result.rows;
  }

  async findById(id: number): Promise<ConversationWithMessages | null> {
    const convResult = await this.pool.query<{ id: number; title: string; createdAt: string }>(
      `SELECT id, title, created_at AS "createdAt" FROM conversations WHERE id = $1 LIMIT 1`,
      [id],
    );
    if (convResult.rowCount === 0) return null;
    const msgResult = await this.pool.query<{ id: number; conversationId: number; role: string; content: string; createdAt: string }>(
      `SELECT id, conversation_id AS "conversationId", role, content, created_at AS "createdAt" FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
      [id],
    );
    return { ...convResult.rows[0], messages: msgResult.rows };
  }

  async create(title: string): Promise<Conversation> {
    const result = await this.pool.query<{ id: number; title: string; createdAt: string }>(
      `INSERT INTO conversations (title) VALUES ($1) RETURNING id, title, created_at AS "createdAt"`,
      [title],
    );
    return result.rows[0];
  }

  async delete(id: number): Promise<void> {
    await this.pool.query("DELETE FROM messages WHERE conversation_id = $1", [id]);
    await this.pool.query("DELETE FROM conversations WHERE id = $1", [id]);
  }

  async addMessage(conversationId: number, role: string, content: string): Promise<void> {
    await this.pool.query(
      `INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3)`,
      [conversationId, role, content],
    );
  }

  async getMessages(conversationId: number): Promise<{ role: string; content: string }[]> {
    const result = await this.pool.query<{ role: string; content: string }>(
      `SELECT role, content FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
      [conversationId],
    );
    return result.rows;
  }
}
