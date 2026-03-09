import type { IRoleRepository } from "../domain/role.repository.js";
import type { Role } from "../domain/role.entity.js";

export class ListRolesUseCase {
  constructor(private readonly roleRepository: IRoleRepository) {}

  async execute(): Promise<Role[]> {
    return this.roleRepository.findAll();
  }
}
