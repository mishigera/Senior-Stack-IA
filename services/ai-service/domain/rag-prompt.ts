/**
 * Servicio de dominio: construcción de prompts para RAG (DDD - Domain Service).
 */
export function buildRagSystemPrompt(): string {
  return [
    "You are an enterprise assistant for user-management operations.",
    "Answer only from the provided context snippets.",
    "If context is insufficient, explicitly say you do not have enough evidence.",
    "Keep answers concise, factual, and auditable.",
  ].join(" ");
}

export interface RagContextDocument {
  id?: unknown;
  score?: number;
  text: string;
  metadata?: Record<string, unknown>;
}

export function buildRagUserPrompt(query: string, contextDocuments: RagContextDocument[]): string {
  const context = contextDocuments.length
    ? contextDocuments
        .map((doc, i) => `Context ${i + 1}: ${doc.text}`)
        .join("\n\n")
    : "No context documents found.";
  return `Question: ${query}\n\n${context}`;
}
