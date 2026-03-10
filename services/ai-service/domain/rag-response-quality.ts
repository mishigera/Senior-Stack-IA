/**
 * Validación básica de calidad de respuestas RAG (Ej. 5 – evaluación de respuestas).
 * Criterios: respuesta no vacía, longitud mínima razonable, y que no sea solo
 * "sin evidencia" cuando sí hubo contexto disponible.
 */

const MIN_ANSWER_LENGTH = 3;
const MIN_RELEVANT_LENGTH = 10;
const NO_EVIDENCE_MARKERS = ["no hay evidencia", "no encontramos evidencia", "no hay información", "sin evidencia"];

export interface RagQualityChecks {
  nonEmpty: boolean;
  minLength: boolean;
  hasRelevantLength: boolean;
  /** true si hubo contexto y la respuesta no es solo "no hay evidencia" */
  usedContextWhenAvailable: boolean;
}

export interface RagQualityResult {
  valid: boolean;
  checks: RagQualityChecks;
}

export function validateRagResponse(
  answer: string,
  contextDocuments: Array<{ text?: string }>,
): RagQualityResult {
  const trimmed = (answer ?? "").trim();
  const hasContext = contextDocuments.length > 0;
  const contextHasContent = contextDocuments.some((d) => (d.text ?? "").trim().length > 0);

  const nonEmpty = trimmed.length > 0;
  const minLength = trimmed.length >= MIN_ANSWER_LENGTH;
  const hasRelevantLength = trimmed.length >= MIN_RELEVANT_LENGTH;
  const lower = trimmed.toLowerCase();
  const isNoEvidenceOnly =
    NO_EVIDENCE_MARKERS.some((m) => lower.includes(m)) && trimmed.length < 80;
  const usedContextWhenAvailable = !hasContext || !contextHasContent || !isNoEvidenceOnly;

  const checks: RagQualityChecks = {
    nonEmpty,
    minLength,
    hasRelevantLength,
    usedContextWhenAvailable,
  };

  const valid =
    nonEmpty && minLength && usedContextWhenAvailable;

  return { valid, checks };
}
