# Coverage report – Prueba Técnica Senior Full-Stack Engineer (IA)

Estado evaluado sobre el código actual del repositorio (marzo 2026).

## Resumen ejecutivo

- **Listo para Docker:** ✅
- **Microservicios en ejecución:** ✅ (gateway + 4 servicios de dominio)
- **Integración IA + RAG funcional:** ✅
- **Tests unitarios:** ✅ 44 tests (14 backend + 30 frontend)
- **Cobertura:** ✅ Reporte generado con `npm run test:coverage` (backend c8 ≥70%, frontend Vitest ≥70% en client/src/lib)
- **Seguridad OWASP:** ✅ (scrypt hashing, sin password leak, validación de inputs)
- **Cumplimiento global de la prueba:** ✅

---

## Ejercicio 1 – Diseño y arquitectura

### Cumple
- Arquitectura de microservicios documentada y ejecutable en Docker.
- Diagrama Mermaid con flujos síncronos y asíncronos: `docs/architecture.md`.
- Justificación técnica y aplicación DDD/Clean Architecture documentadas.
- Estrategia multi-DB aplicada: Postgres + MongoDB + Redis + Qdrant.

### Observaciones
- `auth` permanece embebido en el gateway (válido funcionalmente como BFF; podría extraerse como servicio dedicado para máxima separación).

---

## Ejercicio 2 – Implementación de microservicios

### Cumple
- Microservicios independientes implementados:
	- `user-service` (puerto 5101)
	- `role-service` (puerto 5102)
	- `audit-service` (puerto 5103)
	- `ai-service` (puerto 5104)
- Comunicación síncrona REST entre gateway y servicios.
- Comunicación asíncrona RabbitMQ (`role-service` publica, `audit-service` consume).
- Multi-DB en código y runtime (Postgres/Mongo/Redis/Qdrant).
- Docker Compose integral con healthchecks en todos los servicios de infraestructura.
- Logging estructurado JSON en gateway y todos los microservicios.
- Tests unitarios para módulos críticos de microservicios (14 tests).
- Seguridad OWASP: hashing con `scrypt`, passwords nunca expuestos en API, validación Zod.

---

## Ejercicio 3 – Front-end

### Cumple
- React + TypeScript (Vite).
- State management: **TanStack React Query** (server state) + **Zustand** (client/UI state, p. ej. panel colapsado en Agent). Store en `client/src/store/ui-store.ts`.
- Tests frontend con Vitest + Testing Library (30 tests).
- Ejecución dockerizada conjunta con backend/microservicios.

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
	- Indexación: `/api/rag/documents`
	- Consulta: `/api/rag/query`
	- Vector DB: Qdrant (contenedor local)
	- Embeddings: `text-embedding-3-small`
	- Generación: `gpt-4.1-mini`
- Prompt engineering documentado: `docs/prompt-engineering.md`.
- Métricas de evaluación por respuesta (`latencyMs`, tokens prompt/completion/total).
- Integración vía gateway con el ecosistema de microservicios.

---

## Suite de tests

### Backend (node:test) – 14 tests
- `user-mapper.test.mjs` – mapeo de filas DB, exclusión de password
- `user-mapper-edge.test.mjs` – campos nulos, contrato de campos
- `audit-event.test.mjs` – estructura de eventos de auditoría
- `audit-event-edge.test.mjs` – validación de tipos, timestamps ISO, preservación de datos
- `rag-prompt.test.mjs` – prompts de sistema y usuario RAG
- `rag-prompt-edge.test.mjs` – edge cases (vacío, múltiples contextos, uno solo)

### Frontend (Vitest) – 30 tests
- `utils.test.ts` – utilidad `cn()` y `buildUrl()`
- `query-client.test.ts` – `apiRequest`, `getQueryFn` (GET/POST/401/200)
- `auth-utils.test.ts` – `isUnauthorizedError`, `redirectToLogin`
- `api-schemas.test.ts` – validación de schemas Zod de API

### Cobertura
```bash
npm run test:coverage           # Backend + frontend, genera reportes
npm run test:coverage:backend   # c8 sobre services/**/*.js (≥70%)
npm run test:coverage:frontend # Vitest sobre client (≥70% en client/src/lib)
```
Reportes: `coverage/backend/` (lcov, text-summary), `coverage/frontend/` (html, lcov).

### Ejecución
```bash
npm run test:all      # Backend + frontend
npm test              # Solo backend (node:test)
npm run test:frontend # Solo frontend (vitest)
```

---

## Correcciones de seguridad aplicadas

1. **Password leak eliminado**: `user-service` ya no incluye `password` en respuestas API ni en queries SQL.
2. **Hashing mejorado**: SHA-256 reemplazado por `crypto.scrypt` con salt aleatorio y comparación timing-safe.
3. **Healthchecks Docker**: Redis, MongoDB y RabbitMQ ahora tienen healthchecks; los servicios dependientes esperan `service_healthy`.
4. **Tipos TypeScript**: Añadidos `@types/passport-jwt` y `@types/jsonwebtoken`.

## Recomendaciones finales

1. Extraer `auth` en servicio dedicado para separación completa.
2. Añadir observabilidad centralizada (OTel + Loki/ELK) para producción.
3. Implementar circuit breaker explícito para APIs de IA (LLM/embeddings).
