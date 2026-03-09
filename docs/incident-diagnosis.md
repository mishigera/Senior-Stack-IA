# Ejercicio 4 – Diagnóstico bajo presión

## Escenario

> "Los usuarios no pueden guardar registros, algunos microservicios responden 500 y hay alta latencia en respuestas de agentes IA".

## Hipótesis priorizadas

1. **Base de datos transaccional degradada** (pool saturado, locks, conexiones agotadas).
2. **Falla de comunicación interna** entre gateway y microservicios (timeouts/restarts).
3. **RabbitMQ con backlog** impidiendo procesamiento oportuno de auditoría.
4. **Dependencias IA degradadas** (rate limiting / latencia de proveedor / timeout en embeddings).
5. **Qdrant o MongoDB con recursos insuficientes** (IO/CPU/memoria).

## Plan de diagnóstico sistemático

1. **Verificar salud global**
   - `docker compose ps`
   - `GET /api/health`
   - `docker compose logs <service> --tail 200`
2. **Correlacionar errores 500**
   - Revisar logs estructurados JSON por servicio (`source`, `message`, `statusCode`, `durationMs`).
   - Identificar primer servicio que falla (gateway vs dominio).
3. **Comprobar capa de datos**
   - Postgres: conexiones activas, queries lentas.
   - MongoDB: inserciones fallidas de auditoría.
   - Redis: latencia/errores de conectividad.
4. **Comprobar mensajería**
   - RabbitMQ: cola `audit.logs`, tasa publish/consume, consumidores activos.
5. **Comprobar IA/RAG**
   - latencia por endpoint `/api/rag/query`
   - token usage por request
   - respuesta de OpenAI/Qdrant y códigos de error.

## Uso de logs centralizados

Con stack centralizado (ELK/OTel/Loki) se recomienda filtrar por:

- `serviceName`/`source`
- `statusCode >= 500`
- `durationMs > threshold`
- ventanas de tiempo durante incidentes

Esto permite construir línea de tiempo del incidente y aislar origen del fallo.

## Problemas específicos de IA considerados

- **Alta latencia**: exceso de contexto, topK alto, proveedor saturado.
- **Costo de tokens**: prompts extensos y respuestas largas.
- **Rate limiting**: burst de requests sin retry/backoff.

## Mitigación táctica

- Reducir temporalmente `topK` y tamaño de contexto.
- Aplicar timeout/retry con backoff para llamadas LLM.
- Activar circuit breaker en gateway para aislar dependencia degradada.
- Escalar horizontalmente servicios críticos.

## Comunicación a stakeholders

- **Cada 15 min**: estado, impacto, hipótesis activas, ETA tentativa.
- **Formato ejecutivo**:
  - Impacto actual
  - Causa probable
  - Mitigación en curso
  - Próximo checkpoint
