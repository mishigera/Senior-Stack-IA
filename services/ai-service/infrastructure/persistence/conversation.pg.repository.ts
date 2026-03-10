import type { Pool } from "pg";
import { asc, desc, eq } from "drizzle-orm";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import type { IConversationRepository } from "../../domain/conversation.repository.js";
import type { Conversation, ConversationWithMessages } from "../../domain/conversation.entity.js";

const conversationsTable = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

const messagesTable = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

export class ConversationPgRepository implements IConversationRepository {
  private readonly db: NodePgDatabase;

  constructor(pool: Pool) {
    this.db = drizzle(pool);
  }

  async findAll(): Promise<Conversation[]> {
    const rows = await this.db
      .select({
        id: conversationsTable.id,
        title: conversationsTable.title,
        createdAt: conversationsTable.createdAt,
      })
      .from(conversationsTable)
      .orderBy(desc(conversationsTable.createdAt));

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      createdAt: toIso(row.createdAt),
    }));
  }

  async findById(id: number): Promise<ConversationWithMessages | null> {
    const [conversation] = await this.db
      .select({
        id: conversationsTable.id,
        title: conversationsTable.title,
        createdAt: conversationsTable.createdAt,
      })
      .from(conversationsTable)
      .where(eq(conversationsTable.id, id))
      .limit(1);

    if (!conversation) return null;

    const messageRows = await this.db
      .select({
        id: messagesTable.id,
        conversationId: messagesTable.conversationId,
        role: messagesTable.role,
        content: messagesTable.content,
        createdAt: messagesTable.createdAt,
      })
      .from(messagesTable)
      .where(eq(messagesTable.conversationId, id))
      .orderBy(asc(messagesTable.createdAt));

    return {
      id: conversation.id,
      title: conversation.title,
      createdAt: toIso(conversation.createdAt),
      messages: messageRows.map((message) => ({
        id: message.id,
        conversationId: message.conversationId,
        role: message.role,
        content: message.content,
        createdAt: toIso(message.createdAt),
      })),
    };
  }

  async create(title: string): Promise<Conversation> {
    const [conversation] = await this.db
      .insert(conversationsTable)
      .values({ title })
      .returning({
        id: conversationsTable.id,
        title: conversationsTable.title,
        createdAt: conversationsTable.createdAt,
      });

    if (!conversation) {
      throw new Error("Failed to create conversation");
    }

    return {
      id: conversation.id,
      title: conversation.title,
      createdAt: toIso(conversation.createdAt),
    };
  }

  async delete(id: number): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.delete(messagesTable).where(eq(messagesTable.conversationId, id));
      await tx.delete(conversationsTable).where(eq(conversationsTable.id, id));
    });
  }

  async addMessage(conversationId: number, role: string, content: string): Promise<void> {
    await this.db.insert(messagesTable).values({ conversationId, role, content });
  }

  async getMessages(conversationId: number): Promise<{ role: string; content: string }[]> {
    return this.db
      .select({
        role: messagesTable.role,
        content: messagesTable.content,
      })
      .from(messagesTable)
      .where(eq(messagesTable.conversationId, conversationId))
      .orderBy(asc(messagesTable.createdAt));
  }
}
