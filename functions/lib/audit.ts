// Audit Log Edge Helper

import { generateId, hashIp } from './crypto';

export interface AuditParams {
  actorUserId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, any>;
  ip?: string;
}

export async function recordAudit(db: any, params: AuditParams): Promise<void> {
  try {
    const id = generateId('aud');
    const ipHash = params.ip ? await hashIp(params.ip) : 'unknown';
    const metadataStr = params.metadata ? JSON.stringify(params.metadata) : null;

    await db.prepare(`
      INSERT INTO audit_logs (id, actor_user_id, action, resource_type, resource_id, metadata, ip_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      params.actorUserId,
      params.action,
      params.resourceType,
      params.resourceId,
      metadataStr,
      ipHash
    ).run();
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
