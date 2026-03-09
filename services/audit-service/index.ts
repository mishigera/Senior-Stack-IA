import express from "express";
import amqp from "amqplib";
import type { ConsumeMessage } from "amqplib";
import { MongoClient, type Collection } from "mongodb";
import swaggerUi from "swagger-ui-express";
import { ListAuditLogsUseCase } from "./application/list-audit-logs.use-case.js";
import { AuditMongoRepository, type MongoAuditDoc } from "./infrastructure/persistence/audit-mongo.repository.js";
import { registerAuditRoutes } from "./infrastructure/http/audit.routes.js";
import { auditServiceOpenApi } from "./infrastructure/http/openapi.js";

const SOURCE = "audit-service";
const port = parseInt(process.env.AUDIT_SERVICE_PORT ?? process.env.PORT ?? "5103", 10);
const rabbitmqUrl = process.env.RABBITMQ_URL ?? "amqp://rabbitmq:5672";
const auditExchange = process.env.AUDIT_EXCHANGE ?? "audit.events";
const auditQueue = process.env.AUDIT_QUEUE ?? "audit.logs";
const mongoUrl = process.env.MONGODB_URL ?? "mongodb://admin:admin@mongodb:27017";
const mongoDbName = process.env.MONGODB_DB ?? "senior_stack_ia";
const mongoCollectionName = process.env.MONGODB_AUDIT_COLLECTION ?? "audit_logs";

const mongoClient = new MongoClient(mongoUrl);
let auditCollection: Collection<MongoAuditDoc> | null = null;
let consumerReady = false;

async function initMongo(): Promise<void> {
  await mongoClient.connect();
  const db = mongoClient.db(mongoDbName);
  auditCollection = db.collection(mongoCollectionName);
  await auditCollection.createIndex({ createdAt: -1 });
}

async function startAuditConsumer(): Promise<void> {
  if (!auditCollection) return;
  try {
    const connection = await amqp.connect(rabbitmqUrl);
    const channel = await connection.createChannel();
    await channel.assertExchange(auditExchange, "topic", { durable: true });
    await channel.assertQueue(auditQueue, { durable: true });
    await channel.bindQueue(auditQueue, auditExchange, "#");

    await channel.consume(auditQueue, async (message: ConsumeMessage | null) => {
      if (!message) return;
      try {
        const payload = JSON.parse(message.content.toString()) as Record<string, unknown>;
        if (!payload?.action || !payload?.resource) {
          channel.ack(message);
          return;
        }
        await auditCollection!.insertOne({
          userId: (payload.userId != null ? String(payload.userId) : null) as string | null,
          action: String(payload.action),
          resource: String(payload.resource),
          details: (payload.details != null ? String(payload.details) : null) as string | null,
          eventType: payload.eventType != null ? String(payload.eventType) : "unknown",
          createdAt: payload.createdAt ? new Date(String(payload.createdAt)) : new Date(),
        });
        channel.ack(message);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(JSON.stringify({ source: SOURCE, level: "error", message: "consume_message_failed", error: msg }));
        channel.nack(message, false, false);
      }
    });

    consumerReady = true;
    connection.on("close", () => {
      consumerReady = false;
      setTimeout(startAuditConsumer, 3000);
    });
    connection.on("error", (err: Error) => {
      console.error(JSON.stringify({ source: SOURCE, level: "error", message: "rabbit_connection_error", error: err.message }));
    });
  } catch (err: unknown) {
    consumerReady = false;
    const msg = err instanceof Error ? err.message : String(err);
    console.error(JSON.stringify({ source: SOURCE, level: "error", message: "consumer_start_failed", error: msg }));
    setTimeout(startAuditConsumer, 3000);
  }
}

const app = express();
app.use(express.json());

app.use("/docs", swaggerUi.serve, swaggerUi.setup(auditServiceOpenApi as object, {
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: "Audit Service – API Docs",
}));

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: SOURCE,
    consumerReady,
    timestamp: new Date().toISOString(),
  });
});

async function main(): Promise<void> {
  await initMongo();
  const repository = new AuditMongoRepository(auditCollection!);
  registerAuditRoutes(app, new ListAuditLogsUseCase(repository), () => !!auditCollection);
  await startAuditConsumer();
}

main().catch((err: unknown) => {
  console.error(JSON.stringify({ source: SOURCE, level: "error", message: "startup_failed", error: err instanceof Error ? err.message : String(err) }));
  process.exit(1);
});

app.listen(port, "0.0.0.0", () => {
  console.log(JSON.stringify({ source: SOURCE, message: `listening_on_${port}` }));
});
