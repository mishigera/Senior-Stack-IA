import type { IUserRepository } from "../domain/user.repository.js";
import type { UserPublic } from "../domain/user.entity.js";

/**
 * Caso de uso: listar todos los usuarios (Application Layer - DDD).
 */
export class ListUsersUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(): Promise<UserPublic[]> {
    return this.userRepository.findAll();
  }
}
