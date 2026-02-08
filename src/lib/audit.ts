import type { PrismaClient } from "@prisma/client";

type Tx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export async function createAuditLog(
  prismaOrTx: Tx,
  data: {
    orgId: string;
    actorUserId: string;
    entityType: string;
    entityId: string;
    action: string;
    metadata?: Record<string, unknown>;
  }
) {
  await prismaOrTx.audit_logs.create({
    data: {
      org_id: data.orgId,
      actor_user_id: data.actorUserId,
      entity_type: data.entityType,
      entity_id: data.entityId,
      action: data.action,
      metadata: (data.metadata ?? undefined) as object | undefined,
    },
  });
}
