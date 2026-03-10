import express from "express";
import pg from "pg";
import OpenAI from "openai";
import { randomUUID } from "crypto";
import { z } from "zod";
import { QdrantClient } from "@qdrant/js-client-rest";
import swaggerUi from "swagger-ui-express";
import { ConversationPgRepository } from "./infrastructure/persistence/conversation.pg.repository.js";
import { buildRagSystemPrompt, buildRagUserPrompt, type RagContextDocument } from "./domain/rag-prompt.js";
import { validateRagResponse } from "./domain/rag-response-quality.js";
import { aiServiceOpenApi } from "./infrastructure/http/openapi.js";
import { requireDistributedJwt } from "../lib/distributed-auth.js";

const SOURCE = "ai-service";
const port = parseInt(process.env.AI_SERVICE_PORT ?? process.env.PORT ?? "5104", 10);
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const qdrantUrl = process.env.QDRANT_URL ?? "http://qdrant:6333";
const qdrantCollection = process.env.QDRANT_COLLECTION ?? "knowledge_base";
const embeddingModel = process.env.AI_EMBEDDING_MODEL ?? "text-embedding-3-small";
const chatModel = process.env.AI_CHAT_MODEL ?? "gpt-4.1-mini";
const ragModel = process.env.AI_RAG_MODEL ?? "gpt-4.1-mini";

let openaiClient: OpenAI | null | undefined;
function getOpenAI(): OpenAI | null {
  if (openaiClient !== undefined) return openaiClient;
  if (!process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
    openaiClient = null;
    return null;
  }
  openaiClient = new OpenAI({
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  });
  return openaiClient;
}

const qdrantClient = new QdrantClient({ url: qdrantUrl });
let qdrantCollectionReady = false;
async function ensureQdrant(): Promise<boolean> {
  if (qdrantCollectionReady) return true;
  try {
    await qdrantClient.getCollection(qdrantCollection);
    qdrantCollectionReady = true;
    return true;
  } catch {
    try {
      await qdrantClient.createCollection(qdrantCollection, { vectors: { size: 1536, distance: "Cosine" } });
      qdrantCollectionReady = true;
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(JSON.stringify({ source: SOURCE, level: "error", message: "qdrant_collection_failed", error: msg }));
      return false;
    }
  }
}

const repo = new ConversationPgRepository(pool);

const ragDocumentSchema = z.object({ id: z.string().optional(), text: z.string().min(1), metadata: z.record(z.any()).optional() });
const ragQuerySchema = z.object({ query: z.string().min(1), topK: z.number().int().positive().max(10).optional() });

const requireActor = requireDistributedJwt(SOURCE);

function paramId(v: string | string[] | undefined): number {
  const id = Array.isArray(v) ? v[0] : v;
  return parseInt(String(id), 10);
}

const app = express();
app.use(express.json({ limit: "5mb" }));

app.use("/docs", swaggerUi.serve, swaggerUi.setup(aiServiceOpenApi as object, {
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: "AI Service – API Docs",
}));

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: SOURCE, timestamp: new Date().toISOString() });
});

app.get("/conversations", requireActor, async (_req, res) => {
  try {
    const list = await repo.findAll();
    res.status(200).json(list);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(JSON.stringify({ source: SOURCE, level: "error", message: "list_conversations_failed", error: msg }));
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

app.get("/conversations/:id", requireActor, async (req, res) => {
  try {
    const id = paramId(req.params.id);
    const conv = await repo.findById(id);
    if (!conv) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }
    res.status(200).json(conv);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(JSON.stringify({ source: SOURCE, level: "error", message: "get_conversation_failed", error: msg }));
    res.status(500).json({ error: "Failed to fetch conversation" });
  }
});

app.post("/conversations", requireActor, async (req, res) => {
  try {
    const title = typeof req.body?.title === "string" && req.body.title.trim() ? req.body.title : "New Chat";
    const conv = await repo.create(title);
    res.status(201).json(conv);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(JSON.stringify({ source: SOURCE, level: "error", message: "create_conversation_failed", error: msg }));
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

app.delete("/conversations/:id", requireActor, async (req, res) => {
  try {
    const id = paramId(req.params.id);
    await repo.delete(id);
    res.status(204).send();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(JSON.stringify({ source: SOURCE, level: "error", message: "delete_conversation_failed", error: msg }));
    res.status(500).json({ error: "Failed to delete conversation" });
  }
});

app.post("/conversations/:id/messages", requireActor, async (req, res) => {
  const openai = getOpenAI();
  if (!openai) {
    res.status(503).json({ error: "AI integration is not configured. Set AI_INTEGRATIONS_OPENAI_API_KEY to enable chat responses." });
    return;
  }
  const conversationId = paramId(req.params.id);
  const content = req.body?.content;
  if (!content || typeof content !== "string") {
    res.status(400).json({ error: "Message content is required" });
    return;
  }
  try {
    await repo.addMessage(conversationId, "user", content);
    const messages = await repo.getMessages(conversationId);
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    const stream = await openai.chat.completions.create({
      model: chatModel,
      messages: messages.map((m) => ({ role: m.role as "user" | "assistant" | "system", content: m.content })),
      stream: true,
      temperature: 0.2,
      max_completion_tokens: 2048,
    });
    let fullResponse = "";
    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content ?? "";
      if (delta) {
        fullResponse += delta;
        res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
      }
    }
    await repo.addMessage(conversationId, "assistant", fullResponse);
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(JSON.stringify({ source: SOURCE, level: "error", message: "send_message_failed", error: msg }));
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: "Failed to send message" })}\n\n`);
      res.end();
    } else {
      res.status(500).json({ error: "Failed to send message" });
    }
  }
});

app.post("/generate-image", requireActor, async (req, res) => {
  const openai = getOpenAI();
  if (!openai) {
    res.status(503).json({ error: "AI integration is not configured." });
    return;
  }
  const prompt = req.body?.prompt;
  const size = req.body?.size ?? "1024x1024";
  if (!prompt || typeof prompt !== "string") {
    res.status(400).json({ error: "Prompt is required" });
    return;
  }
  try {
    const response = await openai.images.generate({ model: "gpt-image-1", prompt, n: 1, size });
    const imageData = response?.data?.[0];
    if (!imageData) res.status(502).json({ error: "No image was generated" });
    else res.status(200).json({ url: imageData.url, b64_json: imageData.b64_json });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(JSON.stringify({ source: SOURCE, level: "error", message: "generate_image_failed", error: msg }));
    res.status(500).json({ error: "Failed to generate image" });
  }
});

app.post("/rag/documents", requireActor, async (req, res) => {
  const openai = getOpenAI();
  if (!openai) {
    res.status(503).json({ error: "AI integration is not configured" });
    return;
  }
  if (!(await ensureQdrant())) {
    res.status(503).json({ error: "Vector database is not available" });
    return;
  }
  try {
    const input = ragDocumentSchema.parse(req.body);
    const embRes = await openai.embeddings.create({ model: embeddingModel, input: input.text });
    const vector = embRes.data[0]?.embedding;
    if (!vector) {
      res.status(502).json({ error: "Embedding generation failed" });
      return;
    }
    const pointId = input.id ?? randomUUID();
    await qdrantClient.upsert(qdrantCollection, {
      wait: true,
      points: [{ id: pointId, vector, payload: { text: input.text, metadata: input.metadata ?? {}, createdAt: new Date().toISOString() } }],
    });
    res.status(201).json({ id: pointId, status: "indexed" });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ message: err.errors[0]?.message ?? "Invalid request" });
      return;
    }
    const msg = err instanceof Error ? err.message : String(err);
    console.error(JSON.stringify({ source: SOURCE, level: "error", message: "index_document_failed", error: msg }));
    res.status(500).json({ error: "Failed to index document" });
  }
});

app.post("/rag/query", requireActor, async (req, res) => {
  const startedAt = Date.now();
  const openai = getOpenAI();
  if (!openai) {
    res.status(503).json({ error: "AI integration is not configured" });
    return;
  }
  if (!(await ensureQdrant())) {
    res.status(503).json({ error: "Vector database is not available" });
    return;
  }
  try {
    const input = ragQuerySchema.parse(req.body);
    const topK = input.topK ?? 3;
    const queryEmb = await openai.embeddings.create({ model: embeddingModel, input: input.query });
    const vector = queryEmb.data[0]?.embedding;
    if (!vector) {
      res.status(502).json({ error: "Failed to embed query" });
      return;
    }
    const searchResults = await qdrantClient.search(qdrantCollection, { vector, limit: topK, with_payload: true });
    const contextDocuments: RagContextDocument[] = searchResults.map((r) => ({
      id: r.id,
      score: r.score,
      text: (r.payload?.text as string) ?? "",
      metadata: (r.payload?.metadata as Record<string, unknown>) ?? {},
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
        ? (answerContent as Array<{ text?: string }>).map((item) => item?.text ?? "").join("\n")
        : "";
    const latencyMs = Date.now() - startedAt;
    const quality = validateRagResponse(answer, contextDocuments);
    res.status(200).json({
      answer,
      contextDocuments,
      metrics: {
        latencyMs,
        tokens: {
          prompt: completion.usage?.prompt_tokens ?? null,
          completion: completion.usage?.completion_tokens ?? null,
          total: completion.usage?.total_tokens ?? null,
        },
        quality: {
          valid: quality.valid,
          checks: quality.checks,
        },
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ message: err.errors[0]?.message ?? "Invalid request" });
      return;
    }
    const msg = err instanceof Error ? err.message : String(err);
    console.error(JSON.stringify({ source: SOURCE, level: "error", message: "rag_query_failed", error: msg }));
    res.status(500).json({ error: "Failed to execute RAG query" });
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log(JSON.stringify({ source: SOURCE, message: `listening_on_${port}` }));
});
