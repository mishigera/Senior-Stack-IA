import express from "express";
import pg from "pg";
import amqp from "amqplib";
import { z } from "zod";
import { buildAuditEvent } from "./lib/auditEvent.js";

const port = parseInt(process.env.ROLE_SERVICE_PORT || process.env.PORT || "5102", 10);
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const rabbitmqUrl = process.env.RABBITMQ_URL || "amqp://rabbitmq:5672";
const auditExchange = process.env.AUDIT_EXCHANGE || "audit.events";

let channelPromise;

async function getChannel() {
  if (!channelPromise) {
    channelPromise = amqp.connect(rabbitmqUrl)
      .then(async (connection) => {
        connection.on("error", (error) => {
          console.error(JSON.stringify({ source: "role-service", level: "error", message: "rabbit_connection_error", error: error.message }));
        });
        connection.on("close", () => {
          channelPromise = undefined;
        });
        const channel = await connection.createChannel();
        await channel.assertExchange(auditExchange, "topic", { durable: true });
        return channel;
      })
      .catch((error) => {
        channelPromise = undefined;
        throw error;
      });
  }
  return channelPromise;
}

async function publishAuditEvent(event) {
  try {
    const channel = await getChannel();
    channel.publish(auditExchange, event.eventType, Buffer.from(JSON.stringify(event)), {
      contentType: "application/json",
      persistent: true,
    });
  } catch (error) {
    console.error(JSON.stringify({ source: "role-service", level: "error", message: "publish_audit_event_failed", error: error?.message }));
  }
}

const app = express();
app.use(express.json());

const createRoleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
});

const assignRoleSchema = z.object({
  roleId: z.number().int().positive(),
});

function requireActor(req, res, next) {
  const actorUserId = req.header("x-actor-user-id");
  if (!actorUserId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "role-service", timestamp: new Date().toISOString() });
});

app.get("/roles", requireActor, async (_req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT id, name, description
      FROM roles
      ORDER BY id ASC
      `,
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error(JSON.stringify({ source: "role-service", level: "error", message: "list_roles_failed", error: error?.message }));
    return res.status(500).json({ message: "Failed to list roles" });
  }
});

app.post("/roles", requireActor, async (req, res) => {
  try {
    const actorUserId = req.header("x-actor-user-id");
    const input = createRoleSchema.parse(req.body);

    const result = await pool.query(
      `
      INSERT INTO roles (name, description)
      VALUES ($1, $2)
      RETURNING id, name, description
      `,
      [input.name, input.description ?? null],
    );

    const role = result.rows[0];

    await publishAuditEvent(
      buildAuditEvent({
        eventType: "role.created",
        userId: actorUserId,
        action: "CREATE_ROLE",
        resource: "ROLE",
        details: `Role created: ${role.name}`,
      }),
    );

    return res.status(201).json(role);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0]?.message || "Invalid request" });
    }

    if (error?.code === "23505") {
      return res.status(409).json({ message: "Role already exists" });
    }

    console.error(JSON.stringify({ source: "role-service", level: "error", message: "create_role_failed", error: error?.message }));
    return res.status(500).json({ message: "Failed to create role" });
  }
});

app.post("/users/:userId/roles", requireActor, async (req, res) => {
  try {
    const actorUserId = req.header("x-actor-user-id");
    const targetUserId = req.params.userId;
    const { roleId } = assignRoleSchema.parse(req.body);

    const userCheck = await pool.query("SELECT id FROM users WHERE id = $1 LIMIT 1", [targetUserId]);
    if (userCheck.rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    await pool.query(
      `
      INSERT INTO user_roles (user_id, role_id)
      VALUES ($1, $2)
      `,
      [targetUserId, roleId],
    );

    await publishAuditEvent(
      buildAuditEvent({
        eventType: "role.assigned",
        userId: actorUserId,
        action: "ASSIGN_ROLE",
        resource: "USER_ROLE",
        details: `Assigned role ${roleId} to user ${targetUserId}`,
      }),
    );

    return res.status(200).json({ message: "Role assigned successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0]?.message || "Invalid request" });
    }

    console.error(JSON.stringify({ source: "role-service", level: "error", message: "assign_role_failed", error: error?.message }));
    return res.status(500).json({ message: "Failed to assign role" });
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log(JSON.stringify({ source: "role-service", message: `listening_on_${port}` }));
});
