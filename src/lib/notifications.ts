import type { PrismaClient } from "@prisma/client";

type Tx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export async function createNotification(
  prismaOrTx: Tx,
  data: {
    orgId: string;
    userId: string;
    type: string;
    title: string;
    body?: string;
    entityType?: string;
    entityId?: string;
  }
) {
  await prismaOrTx.notifications.create({
    data: {
      org_id: data.orgId,
      user_id: data.userId,
      type: data.type,
      title: data.title,
      body: data.body ?? null,
      entity_type: data.entityType ?? null,
      entity_id: data.entityId ?? null,
    },
  });
}
