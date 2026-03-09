export function buildRagSystemPrompt() {
  return [
    "You are an enterprise assistant for user-management operations.",
    "Answer only from the provided context snippets.",
    "If context is insufficient, explicitly say you do not have enough evidence.",
    "Keep answers concise, factual, and auditable.",
  ].join(" ");
}

export function buildRagUserPrompt(query, contextDocuments) {
  const context = contextDocuments.length
    ? contextDocuments
        .map((document, index) => `Context ${index + 1}: ${document.text}`)
        .join("\n\n")
    : "No context documents found.";

  return `Question: ${query}\n\n${context}`;
}
