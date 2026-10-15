const {pool} = require('../config/db');


const logAudit = async ({
  client,
  userId = null,
  organizationId = null,
  action,
  entityType = null,
  entityId = null,
  result = 'success',
  oldValues = null,
  newValues = null,
  ipAddress = null,
  userAgent = null
}) => {
  if (!client) {
    throw new Error(
      'Database client is required for audit logging'
    );
  }

  if (!action) {
    throw new Error('Audit action is required');
  }

  const query = `
    INSERT INTO audit_logs (
      user_id,
      organization_id,
      action,
      entity_type,
      entity_id,
      result,
      old_values,
      new_values,
      ip_address,
      user_agent
    )
    VALUES (
      $1, $2, $3, $4, $5, $6,
      $7::jsonb, $8::jsonb, $9, $10
    )
    RETURNING id, created_at
  `;

  const values = [
    userId,
    organizationId,
    action,
    entityType,
    entityId,
    result,
    oldValues == null ? null : JSON.stringify(oldValues),
    newValues == null ? null : JSON.stringify(newValues),
    ipAddress,
    userAgent
  ];

  const auditResult = await client.query(query, values);

  return auditResult.rows[0];
};

module.exports = { logAudit };
