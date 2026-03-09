# Coverage report – Prueba Técnica Senior Full-Stack Engineer (IA)

Estado evaluado sobre el código actual del repositorio (marzo 2026).

## Resumen ejecutivo

- **Listo para Docker:** ✅
- **Microservicios en ejecución:** ✅ (gateway + 4 servicios de dominio)
- **Integración IA + RAG funcional:** ✅
- **Cumplimiento global de la prueba:** ✅ con observaciones menores (tests/coverage formal)

---

## Ejercicio 1 – Diseño y arquitectura

### Cumple
- Arquitectura de microservicios documentada y ejecutable en Docker.
- Diagrama Mermaid con flujos síncronos y asíncronos: `docs/architecture.md`.
- Justificación técnica y aplicación DDD/Clean Architecture documentadas.
- Estrategia multi-DB aplicada: Postgres + MongoDB + Redis + Qdrant.

### Observaciones
- `auth` permanece embebido en el gateway (válido funcionalmente, aunque podría extraerse como servicio dedicado para máxima separación).

---

## Ejercicio 2 – Implementación de microservicios

### Cumple
- Microservicios independientes implementados:
	- `user-service`
	- `role-service`
	- `audit-service`
	- `ai-service`
- Comunicación síncrona REST entre gateway y servicios.
- Comunicación asíncrona RabbitMQ (`role-service` publica, `audit-service` consume).
- Multi-DB en código y runtime (Postgres/Mongo/Redis/Qdrant).
- Docker Compose integral con todas las dependencias.
- Logging estructurado JSON en gateway y servicios nuevos.
- Tests base añadidos para módulos críticos de microservicios.

### Observaciones
- Coverage formal ≥70% aún no certificado con reporte de cobertura automático.

---

## Ejercicio 3 – Front-end

### Cumple
- React + TypeScript.
- Integración con gateway (que orquesta microservicios users/roles/audit/ai).
- Estados de carga y errores en hooks/páginas.
- Validación de formularios en auth/roles.
- Ejecución dockerizada conjunta con backend/microservicios.

### Observaciones
- Estado global se maneja con React Query (server state).
- Tests frontend formales (RTL/Jest) quedan recomendados para cerrar cobertura cuantitativa.

---

## Ejercicio 4 – Diagnóstico bajo presión

### Cumple
- Entregable formal creado: `docs/incident-diagnosis.md`.
- Incluye hipótesis priorizadas, plan de diagnóstico, uso de logs, enfoque IA (latencia/costo/rate-limit) y plan de comunicación.

---

## Ejercicio 5 – IA y agentes (RAG)

### Cumple
- `ai-service` dedicado con chat e imagen.
- RAG funcional:
	- indexación `/api/rag/documents`
	- consulta `/api/rag/query`
	- vector DB Qdrant
	- embeddings y generación con OpenAI
- Prompt engineering documentado: `docs/prompt-engineering.md`.
- Métricas de evaluación por respuesta (`latencyMs`, tokens prompt/completion/total).
- Integración vía gateway con el ecosistema de microservicios.

### Observaciones
- Recomendable añadir política explícita de retry/backoff y circuit breaker para APIs LLM.

---

## Cambios aplicados en esta iteración

- Orquestación Docker completa con gateway + `user-service` + `role-service` + `audit-service` + `ai-service`.
- Infra añadida y conectada: Redis, MongoDB, RabbitMQ, Qdrant.
- Gateway refactorizado a proxy/orquestador de microservicios preservando contrato API del frontend.
- Auditoría asíncrona por eventos de dominio publicados en RabbitMQ.
- RAG implementado con endpoints y métricas de latencia/tokens.
- Entregables documentales de arquitectura, prompts y diagnóstico.
- Suite de pruebas base con `node:test` para módulos de microservicios.

## Recomendaciones finales

1. Extraer `auth` en servicio dedicado para separación completa.
2. Incorporar reporte automático de cobertura (c8/nyc) y elevar a ≥70% con tests frontend/backend.
3. Añadir observabilidad centralizada (OTel + Loki/ELK) para producción.
