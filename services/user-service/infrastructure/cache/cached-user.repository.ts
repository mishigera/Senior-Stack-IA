import type { RedisClientType } from "redis";
import type { IUserRepository } from "../../domain/user.repository.js";
import type { UserPublic } from "../../domain/user.entity.js";

const TTL_SECONDS = 30;

/**
 * Decorator de infraestructura: cache Redis sobre el repositorio de usuarios (DDD - capa de infra).
 */
export class CachedUserRepository implements IUserRepository {
  constructor(
    private readonly inner: IUserRepository,
    private readonly redis: RedisClientType | null,
  ) {}

  async findAll(): Promise<UserPublic[]> {
    const key = "users:list";
    const cached = await this.get(key);
    if (cached) return JSON.parse(cached) as UserPublic[];
    const list = await this.inner.findAll();
    await this.set(key, JSON.stringify(list));
    return list;
  }

  async findById(id: string): Promise<UserPublic | null> {
    const key = `users:get:${id}`;
    const cached = await this.get(key);
    if (cached) return JSON.parse(cached) as UserPublic;
    const user = await this.inner.findById(id);
    if (user) await this.set(key, JSON.stringify(user));
    return user;
  }

  private async get(key: string): Promise<string | null> {
    if (!this.redis?.isOpen) return null;
    return this.redis.get(key);
  }

  private async set(key: string, value: string): Promise<void> {
    if (!this.redis?.isOpen) return;
    await this.redis.setEx(key, TTL_SECONDS, value);
  }
}
