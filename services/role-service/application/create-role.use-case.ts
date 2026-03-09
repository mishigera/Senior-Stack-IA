import type { IRoleRepository } from "../domain/role.repository.js";
import type { IAuditEventPublisher } from "../domain/audit-event-publisher.js";
import type { Role } from "../domain/role.entity.js";
import { buildAuditEvent } from "../domain/audit-domain-event.js";

export class CreateRoleUseCase {
  constructor(
    private readonly roleRepository: IRoleRepository,
    private readonly auditPublisher: IAuditEventPublisher,
  ) {}

  async execute(
    input: { name: string; description: string | null },
    actorUserId: string | undefined,
  ): Promise<Role> {
    const role = await this.roleRepository.create(input.name, input.description);
    await this.auditPublisher.publish(
      buildAuditEvent({
        eventType: "role.created",
        userId: actorUserId,
        action: "CREATE_ROLE",
        resource: "ROLE",
        details: `Role created: ${role.name}`,
      }),
    );
    return role;
  }
}
