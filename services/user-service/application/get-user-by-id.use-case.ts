import type { IUserRepository } from "../domain/user.repository.js";
import type { UserPublic } from "../domain/user.entity.js";

/**
 * Caso de uso: obtener un usuario por ID (Application Layer - DDD).
 */
export class GetUserByIdUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(id: string): Promise<UserPublic | null> {
    return this.userRepository.findById(id);
  }
}
