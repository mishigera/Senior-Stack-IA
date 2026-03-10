# RAG API (Gateway)

## Indexar documento

- `POST /api/rag/documents`
- Body:

```json
{
  "id": "optional-doc-id",
  "text": "contenido a indexar",
  "metadata": { "source": "manual" }
}
```

## Consultar RAG

- `POST /api/rag/query`
- Body:

```json
{
  "query": "¿Qué roles existen para administración?",
  "topK": 3
}
```

## Respuesta esperada

Incluye:

- `answer`
- `contextDocuments`
- `metrics` (`latencyMs`, tokens prompt/completion/total, `quality`: validación básica con `valid` y `checks`)
