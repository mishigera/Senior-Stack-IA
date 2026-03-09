import express from "express";
import pg from "pg";
import { createClient } from "redis";
import { mapUserRow } from "./lib/mappers.js";

const port = parseInt(process.env.USER_SERVICE_PORT || process.env.PORT || "5101", 10);
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

let redisClient = null;
if (process.env.REDIS_URL) {
  redisClient = createClient({ url: process.env.REDIS_URL });
  redisClient.on("error", (error) => {
    console.error(JSON.stringify({ source: "user-service", level: "error", message: "redis_error", error: error.message }));
  });
  redisClient.connect().catch((error) => {
    console.error(JSON.stringify({ source: "user-service", level: "error", message: "redis_connect_failed", error: error.message }));
  });
}

const app = express();
app.use(express.json());

function requireActor(req, res, next) {
  const actorUserId = req.header("x-actor-user-id");
  if (!actorUserId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

async function getCachedValue(key) {
  if (!redisClient || !redisClient.isOpen) return null;
  return redisClient.get(key);
}

async function setCachedValue(key, value, ttlSeconds = 30) {
  if (!redisClient || !redisClient.isOpen) return;
  await redisClient.setEx(key, ttlSeconds, value);
}

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "user-service", timestamp: new Date().toISOString() });
});

app.get("/users", requireActor, async (_req, res) => {
  try {
    const cacheKey = "users:list";
    const cached = await getCachedValue(cacheKey);
    if (cached) {
      return res.status(200).json(JSON.parse(cached));
    }

    const result = await pool.query(
      `
      SELECT id, username, email, first_name, last_name, profile_image_url, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
      `,
    );
    const users = result.rows.map(mapUserRow);

    await setCachedValue(cacheKey, JSON.stringify(users));

    return res.status(200).json(users);
  } catch (error) {
    console.error(JSON.stringify({ source: "user-service", level: "error", message: "list_users_failed", error: error?.message }));
    return res.status(500).json({ message: "Failed to list users" });
  }
});

app.get("/users/:id", requireActor, async (req, res) => {
  try {
    const userId = req.params.id;
    const cacheKey = `users:get:${userId}`;
    const cached = await getCachedValue(cacheKey);
    if (cached) {
      return res.status(200).json(JSON.parse(cached));
    }

    const result = await pool.query(
      `
      SELECT id, username, email, first_name, last_name, profile_image_url, created_at, updated_at
      FROM users
      WHERE id = $1
      LIMIT 1
      `,
      [userId],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = mapUserRow(result.rows[0]);
    await setCachedValue(cacheKey, JSON.stringify(user));

    return res.status(200).json(user);
  } catch (error) {
    console.error(JSON.stringify({ source: "user-service", level: "error", message: "get_user_failed", error: error?.message }));
    return res.status(500).json({ message: "Failed to get user" });
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log(JSON.stringify({ source: "user-service", message: `listening_on_${port}` }));
});
