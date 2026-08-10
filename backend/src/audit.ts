import { AuditLog } from './models/index.ts';
import type { Types } from 'mongoose';

export async function audit(
  actorId: Types.ObjectId | string | null,
  action: string,
  entity?: string,
  entityId?: string | number | Types.ObjectId,
  meta?: unknown,
): Promise<void> {
  await AuditLog.create({
    actorId: actorId ?? null,
    action,
    entity: entity ?? null,
    entityId: entityId === undefined ? null : String(entityId),
    meta: meta ?? null,
  });
}
