import express from "express";
import pg from "pg";
import { createClient, type RedisClientType } from "redis";
import swaggerUi from "swagger-ui-express";
import { ListUsersUseCase } from "./application/list-users.use-case.js";
import { GetUserByIdUseCase } from "./application/get-user-by-id.use-case.js";
import { UserPgRepository } from "./infrastructure/persistence/user.pg.repository.js";
import { CachedUserRepository } from "./infrastructure/cache/cached-user.repository.js";
import { registerUserRoutes } from "./infrastructure/http/user.routes.js";
import { userServiceOpenApi } from "./infrastructure/http/openapi.js";

const port = parseInt(process.env.USER_SERVICE_PORT ?? process.env.PORT ?? "5101", 10);
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

let redisClient: RedisClientType | null = null;
if (process.env.REDIS_URL) {
  redisClient = createClient({ url: process.env.REDIS_URL }) as RedisClientType;
  redisClient.on("error", (err) => {
    console.error(
      JSON.stringify({
        source: "user-service",
        level: "error",
        message: "redis_error",
        error: err.message,
      }),
    );
  });
  redisClient.connect().catch((err) => {
    console.error(
      JSON.stringify({
        source: "user-service",
        level: "error",
        message: "redis_connect_failed",
        error: err.message,
      }),
    );
  });
}

// DDD: composición de capas
const pgRepo = new UserPgRepository(pool);
const userRepository = new CachedUserRepository(pgRepo, redisClient);
const listUsersUseCase = new ListUsersUseCase(userRepository);
const getUserByIdUseCase = new GetUserByIdUseCase(userRepository);

const app = express();
app.use(express.json());

// Swagger
app.use("/docs", swaggerUi.serve, swaggerUi.setup(userServiceOpenApi as object, {
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: "User Service – API Docs",
}));

registerUserRoutes(app, listUsersUseCase, getUserByIdUseCase);

app.listen(port, "0.0.0.0", () => {
  console.log(JSON.stringify({ source: "user-service", message: `listening_on_${port}` }));
});
