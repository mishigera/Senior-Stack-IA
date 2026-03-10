# Estrategia de Prompt Engineering (AI Service)

## Objetivo

Garantizar respuestas útiles, trazables y consistentes para consultas sobre gestión de usuarios/roles usando RAG.

## Diseño de prompts

### 1) System prompt

Se fuerza al modelo a:

- Responder solo con evidencia del contexto recuperado.
- Declarar explícitamente cuando no hay evidencia suficiente.
- Mantener estilo conciso y verificable.

Implementación: `services/ai-service/lib/ragPrompt.js` (`buildRagSystemPrompt`).

### 2) User prompt

Se compone con:

- Pregunta original del usuario.
- Bloques de contexto (`Context 1`, `Context 2`, ...)

Implementación: `buildRagUserPrompt(query, contextDocuments)`.

## Flujo RAG

1. Indexación: `/api/rag/documents`
   - Genera embedding (`text-embedding-3-small`).
   - Guarda vector + payload en Qdrant.
2. Consulta: `/api/rag/query`
   - Embedding de consulta.
   - Recuperación top-K en Qdrant.
   - Construcción de prompt con contexto recuperado.
   - Generación final con modelo de chat.

## Métricas de evaluación

Respuesta de `/api/rag/query` incluye:

- `metrics.latencyMs`
- `metrics.tokens.prompt`
- `metrics.tokens.completion`
- `metrics.tokens.total`
- `metrics.quality`: validación básica de calidad (`valid`, `checks`: nonEmpty, minLength, hasRelevantLength, usedContextWhenAvailable). Implementación: `services/ai-service/domain/rag-response-quality.ts`.

Estas métricas permiten monitorear latencia, costo de tokens y calidad de respuesta por solicitud.

## Buenas prácticas aplicadas

- Temperatura baja para respuestas estables (`0.2`).
- Límite explícito de `topK` para controlar costo y ruido.
- Degradación controlada con `503` si faltan dependencias de IA.
