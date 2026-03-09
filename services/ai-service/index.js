import express from "express";
import pg from "pg";
import OpenAI from "openai";
import { randomUUID } from "crypto";
import { z } from "zod";
import { QdrantClient } from "@qdrant/js-client-rest";
import { buildRagSystemPrompt, buildRagUserPrompt } from "./lib/ragPrompt.js";

const port = parseInt(process.env.AI_SERVICE_PORT || process.env.PORT || "5104", 10);
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const qdrantUrl = process.env.QDRANT_URL || "http://qdrant:6333";
const qdrantCollection = process.env.QDRANT_COLLECTION || "knowledge_base";
const embeddingModel = process.env.AI_EMBEDDING_MODEL || "text-embedding-3-small";
const chatModel = process.env.AI_CHAT_MODEL || "gpt-4.1-mini";
const ragModel = process.env.AI_RAG_MODEL || "gpt-4.1-mini";

let openaiClient;
let qdrantClient;
let qdrantCollectionReady = false;

function getOpenAIClient() {
  if (openaiClient !== undefined) {
    return openaiClient;
  }

  if (!process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
    openaiClient = null;
    return openaiClient;
  }

  openaiClient = new OpenAI({
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  });

  return openaiClient;
}

function getQdrantClient() {
  if (!qdrantClient) {
    qdrantClient = new QdrantClient({ url: qdrantUrl });
  }
  return qdrantClient;
}

async function ensureQdrantCollection() {
  if (qdrantCollectionReady) return true;

  const client = getQdrantClient();

  try {
    await client.getCollection(qdrantCollection);
    qdrantCollectionReady = true;
    return true;
  } catch (_error) {
    try {
      await client.createCollection(qdrantCollection, {
        vectors: {
          size: 1536,
          distance: "Cosine",
        },
      });
      qdrantCollectionReady = true;
      return true;
    } catch (createError) {
      console.error(JSON.stringify({ source: "ai-service", level: "error", message: "qdrant_collection_failed", error: createError?.message }));
      qdrantCollectionReady = false;
      return false;
    }
  }
}

const app = express();
app.use(express.json({ limit: "5mb" }));

const ragDocumentSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1),
  metadata: z.record(z.any()).optional(),
});

const ragQuerySchema = z.object({
  query: z.string().min(1),
  topK: z.number().int().positive().max(10).optional(),
});

function requireActor(req, res, next) {
  const actorUserId = req.header("x-actor-user-id");
  if (!actorUserId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

function getParamId(value) {
  if (Array.isArray(value)) return value[0];
  return value;
}

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "ai-service", timestamp: new Date().toISOString() });
});

app.get("/conversations", requireActor, async (_req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT id, title, created_at AS "createdAt"
      FROM conversations
      ORDER BY created_at DESC
      `,
    );
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error(JSON.stringify({ source: "ai-service", level: "error", message: "list_conversations_failed", error: error?.message }));
    return res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

app.get("/conversations/:id", requireActor, async (req, res) => {
  try {
    const id = parseInt(getParamId(req.params.id), 10);

    const conversationResult = await pool.query(
      `
      SELECT id, title, created_at AS "createdAt"
      FROM conversations
      WHERE id = $1
      LIMIT 1
      `,
      [id],
    );

    if (conversationResult.rowCount === 0) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const messagesResult = await pool.query(
      `
      SELECT id, conversation_id AS "conversationId", role, content, created_at AS "createdAt"
      FROM messages
      WHERE conversation_id = $1
      ORDER BY created_at ASC
      `,
      [id],
    );

    return res.status(200).json({ ...conversationResult.rows[0], messages: messagesResult.rows });
  } catch (error) {
    console.error(JSON.stringify({ source: "ai-service", level: "error", message: "get_conversation_failed", error: error?.message }));
    return res.status(500).json({ error: "Failed to fetch conversation" });
  }
});

app.post("/conversations", requireActor, async (req, res) => {
  try {
    const title = typeof req.body?.title === "string" && req.body.title.trim() ? req.body.title : "New Chat";

    const result = await pool.query(
      `
      INSERT INTO conversations (title)
      VALUES ($1)
      RETURNING id, title, created_at AS "createdAt"
      `,
      [title],
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(JSON.stringify({ source: "ai-service", level: "error", message: "create_conversation_failed", error: error?.message }));
    return res.status(500).json({ error: "Failed to create conversation" });
  }
});

app.delete("/conversations/:id", requireActor, async (req, res) => {
  try {
    const id = parseInt(getParamId(req.params.id), 10);

    await pool.query("DELETE FROM messages WHERE conversation_id = $1", [id]);
    await pool.query("DELETE FROM conversations WHERE id = $1", [id]);

    return res.status(204).send();
  } catch (error) {
    console.error(JSON.stringify({ source: "ai-service", level: "error", message: "delete_conversation_failed", error: error?.message }));
    return res.status(500).json({ error: "Failed to delete conversation" });
  }
});

app.post("/conversations/:id/messages", requireActor, async (req, res) => {
  try {
    const openai = getOpenAIClient();
    if (!openai) {
      return res.status(503).json({
        error: "AI integration is not configured. Set AI_INTEGRATIONS_OPENAI_API_KEY to enable chat responses.",
      });
    }

    const conversationId = parseInt(getParamId(req.params.id), 10);
    const content = req.body?.content;

    if (!content || typeof content !== "string") {
      return res.status(400).json({ error: "Message content is required" });
    }

    await pool.query(
      `
      INSERT INTO messages (conversation_id, role, content)
      VALUES ($1, $2, $3)
      `,
      [conversationId, "user", content],
    );

    const historyResult = await pool.query(
      `
      SELECT role, content
      FROM messages
      WHERE conversation_id = $1
      ORDER BY created_at ASC
      `,
      [conversationId],
    );

    const messages = historyResult.rows.map((message) => ({ role: message.role, content: message.content }));

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const stream = await openai.chat.completions.create({
      model: chatModel,
      messages,
      stream: true,
      temperature: 0.2,
      max_completion_tokens: 2048,
    });

    let fullResponse = "";

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content || "";
      if (delta) {
        fullResponse += delta;
        res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
      }
    }

    await pool.query(
      `
      INSERT INTO messages (conversation_id, role, content)
      VALUES ($1, $2, $3)
      `,
      [conversationId, "assistant", fullResponse],
    );

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    return res.end();
  } catch (error) {
    console.error(JSON.stringify({ source: "ai-service", level: "error", message: "send_message_failed", error: error?.message }));
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: "Failed to send message" })}\n\n`);
      return res.end();
    }
    return res.status(500).json({ error: "Failed to send message" });
  }
});

app.post("/generate-image", requireActor, async (req, res) => {
  try {
    const openai = getOpenAIClient();
    if (!openai) {
      return res.status(503).json({
        error: "AI integration is not configured. Set AI_INTEGRATIONS_OPENAI_API_KEY to enable image generation.",
      });
    }

    const prompt = req.body?.prompt;
    const size = req.body?.size || "1024x1024";

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      n: 1,
      size,
    });

    const imageData = response?.data?.[0];
    if (!imageData) {
      return res.status(502).json({ error: "No image was generated" });
    }

    return res.status(200).json({
      url: imageData.url,
      b64_json: imageData.b64_json,
    });
  } catch (error) {
    console.error(JSON.stringify({ source: "ai-service", level: "error", message: "generate_image_failed", error: error?.message }));
    return res.status(500).json({ error: "Failed to generate image" });
  }
});

app.post("/rag/documents", requireActor, async (req, res) => {
  try {
    const openai = getOpenAIClient();
    if (!openai) {
      return res.status(503).json({ error: "AI integration is not configured" });
    }

    const collectionReady = await ensureQdrantCollection();
    if (!collectionReady) {
      return res.status(503).json({ error: "Vector database is not available" });
    }

    const input = ragDocumentSchema.parse(req.body);

    const embeddingResponse = await openai.embeddings.create({
      model: embeddingModel,
      input: input.text,
    });

    const vector = embeddingResponse.data[0]?.embedding;
    if (!vector) {
      return res.status(502).json({ error: "Embedding generation failed" });
    }

    const pointId = input.id || randomUUID();

    await getQdrantClient().upsert(qdrantCollection, {
      wait: true,
      points: [
        {
          id: pointId,
          vector,
          payload: {
            text: input.text,
            metadata: input.metadata ?? {},
            createdAt: new Date().toISOString(),
          },
        },
      ],
    });

    return res.status(201).json({ id: pointId, status: "indexed" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0]?.message || "Invalid request" });
    }

    console.error(JSON.stringify({ source: "ai-service", level: "error", message: "index_document_failed", error: error?.message }));
    return res.status(500).json({ error: "Failed to index document" });
  }
});

app.post("/rag/query", requireActor, async (req, res) => {
  const startedAt = Date.now();

  try {
    const openai = getOpenAIClient();
    if (!openai) {
      return res.status(503).json({ error: "AI integration is not configured" });
    }

    const collectionReady = await ensureQdrantCollection();
    if (!collectionReady) {
      return res.status(503).json({ error: "Vector database is not available" });
    }

    const input = ragQuerySchema.parse(req.body);
    const topK = input.topK || 3;

    const queryEmbedding = await openai.embeddings.create({
      model: embeddingModel,
      input: input.query,
    });

    const vector = queryEmbedding.data[0]?.embedding;
    if (!vector) {
      return res.status(502).json({ error: "Failed to embed query" });
    }

    const searchResults = await getQdrantClient().search(qdrantCollection, {
      vector,
      limit: topK,
      with_payload: true,
    });

    const contextDocuments = searchResults.map((result) => ({
      id: result.id,
      score: result.score,
      text: result.payload?.text || "",
      metadata: result.payload?.metadata || {},
    }));

    const completion = await openai.chat.completions.create({
      model: ragModel,
      messages: [
        { role: "system", content: buildRagSystemPrompt() },
        { role: "user", content: buildRagUserPrompt(input.query, contextDocuments) },
      ],
      temperature: 0.2,
    });

    const answerContent = completion.choices?.[0]?.message?.content;
    const answer = typeof answerContent === "string"
      ? answerContent
      : Array.isArray(answerContent)
        ? answerContent.map((item) => item?.text || "").join("\n")
        : "";

    const latencyMs = Date.now() - startedAt;

    return res.status(200).json({
      answer,
      contextDocuments,
      metrics: {
        latencyMs,
        tokens: {
          prompt: completion.usage?.prompt_tokens ?? null,
          completion: completion.usage?.completion_tokens ?? null,
          total: completion.usage?.total_tokens ?? null,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0]?.message || "Invalid request" });
    }

    console.error(JSON.stringify({ source: "ai-service", level: "error", message: "rag_query_failed", error: error?.message }));
    return res.status(500).json({ error: "Failed to execute RAG query" });
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log(JSON.stringify({ source: "ai-service", message: `listening_on_${port}` }));
});
