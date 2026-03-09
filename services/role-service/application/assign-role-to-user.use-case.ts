import type { IRoleRepository } from "../domain/role.repository.js";
import type { IAuditEventPublisher } from "../domain/audit-event-publisher.js";
import { buildAuditEvent } from "../domain/audit-domain-event.js";

export class AssignRoleToUserUseCase {
  constructor(
    private readonly roleRepository: IRoleRepository,
    private readonly auditPublisher: IAuditEventPublisher,
  ) {}

  async execute(
    userId: string,
    roleId: number,
    actorUserId: string | undefined,
  ): Promise<void> {
    const exists = await this.roleRepository.existsUser(userId);
    if (!exists) throw new AssignRoleError("User not found", 404);
    await this.roleRepository.assignRoleToUser(userId, roleId);
    await this.auditPublisher.publish(
      buildAuditEvent({
        eventType: "role.assigned",
        userId: actorUserId,
        action: "ASSIGN_ROLE",
        resource: "USER_ROLE",
        details: `Assigned role ${roleId} to user ${userId}`,
      }),
    );
  }
}

export class AssignRoleError extends Error {
  constructor(
    message: string,
    public readonly code: 404 = 404,
  ) {
    super(message);
    this.name = "AssignRoleError";
  }
}
