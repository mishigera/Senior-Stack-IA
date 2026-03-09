import type { UserPublic } from "./user.entity.js";

/**
 * Puerto de dominio (DDD): contrato del repositorio de usuarios.
 * La infraestructura implementa este contrato (adaptador PostgreSQL).
 */
export interface IUserRepository {
  findAll(): Promise<UserPublic[]>;
  findById(id: string): Promise<UserPublic | null>;
}
