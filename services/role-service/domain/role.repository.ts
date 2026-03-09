import type { Role } from "./role.entity.js";

/**
 * Puerto de dominio: repositorio de roles.
 */
export interface IRoleRepository {
  findAll(): Promise<Role[]>;
  create(name: string, description: string | null): Promise<Role>;
  assignRoleToUser(userId: string, roleId: number): Promise<void>;
  existsUser(userId: string): Promise<boolean>;
}
