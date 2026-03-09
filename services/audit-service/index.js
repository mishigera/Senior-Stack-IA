import express from "express";
import amqp from "amqplib";
import { MongoClient } from "mongodb";

const port = parseInt(process.env.AUDIT_SERVICE_PORT || process.env.PORT || "5103", 10);
const rabbitmqUrl = process.env.RABBITMQ_URL || "amqp://rabbitmq:5672";
const auditExchange = process.env.AUDIT_EXCHANGE || "audit.events";
const auditQueue = process.env.AUDIT_QUEUE || "audit.logs";
const mongoUrl = process.env.MONGODB_URL || "mongodb://admin:admin@mongodb:27017";
const mongoDbName = process.env.MONGODB_DB || "senior_stack_ia";
const mongoCollectionName = process.env.MONGODB_AUDIT_COLLECTION || "audit_logs";

const mongoClient = new MongoClient(mongoUrl);
let auditCollection;
let consumerReady = false;

const app = express();
app.use(express.json());

function requireActor(req, res, next) {
  const actorUserId = req.header("x-actor-user-id");
  if (!actorUserId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

async function initMongo() {
  await mongoClient.connect();
  const db = mongoClient.db(mongoDbName);
  auditCollection = db.collection(mongoCollectionName);
  await auditCollection.createIndex({ createdAt: -1 });
}

function mapAuditDocument(document) {
  return {
    id: document._id.toString(),
    userId: document.userId ?? null,
    action: document.action,
    resource: document.resource,
    details: document.details ?? null,
    createdAt: document.createdAt,
  };
}

async function startAuditConsumer() {
  try {
    const connection = await amqp.connect(rabbitmqUrl);
    const channel = await connection.createChannel();

    await channel.assertExchange(auditExchange, "topic", { durable: true });
    await channel.assertQueue(auditQueue, { durable: true });
    await channel.bindQueue(auditQueue, auditExchange, "#");

    await channel.consume(auditQueue, async (message) => {
      if (!message) return;

      try {
        const payload = JSON.parse(message.content.toString());
        if (!payload?.action || !payload?.resource) {
          channel.ack(message);
          return;
        }

        await auditCollection.insertOne({
          userId: payload.userId ?? null,
          action: payload.action,
          resource: payload.resource,
          details: payload.details ?? null,
          eventType: payload.eventType ?? "unknown",
          createdAt: payload.createdAt ? new Date(payload.createdAt) : new Date(),
        });

        channel.ack(message);
      } catch (error) {
        console.error(JSON.stringify({ source: "audit-service", level: "error", message: "consume_message_failed", error: error?.message }));
        channel.nack(message, false, false);
      }
    });

    consumerReady = true;

    connection.on("close", () => {
      consumerReady = false;
      setTimeout(startAuditConsumer, 3000);
    });

    connection.on("error", (error) => {
      console.error(JSON.stringify({ source: "audit-service", level: "error", message: "rabbit_connection_error", error: error?.message }));
    });
  } catch (error) {
    consumerReady = false;
    console.error(JSON.stringify({ source: "audit-service", level: "error", message: "consumer_start_failed", error: error?.message }));
    setTimeout(startAuditConsumer, 3000);
  }
}

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "audit-service",
    consumerReady,
    timestamp: new Date().toISOString(),
  });
});

app.get("/audit-logs", requireActor, async (_req, res) => {
  try {
    if (!auditCollection) {
      return res.status(503).json({ message: "Audit storage is not ready" });
    }

    const documents = await auditCollection.find({}).sort({ createdAt: -1 }).limit(500).toArray();
    return res.status(200).json(documents.map(mapAuditDocument));
  } catch (error) {
    console.error(JSON.stringify({ source: "audit-service", level: "error", message: "list_audit_logs_failed", error: error?.message }));
    return res.status(500).json({ message: "Failed to list audit logs" });
  }
});

initMongo()
  .then(() => startAuditConsumer())
  .catch((error) => {
    console.error(JSON.stringify({ source: "audit-service", level: "error", message: "startup_failed", error: error?.message }));
    process.exit(1);
  });

app.listen(port, "0.0.0.0", () => {
  console.log(JSON.stringify({ source: "audit-service", message: `listening_on_${port}` }));
});
