const directus = require('./directus');

async function logAudit(req, { action, entity, entityId, metadata } = {}) {
  try {
    await directus.create('audit_logs', {
      actor_id: req.user?.id || null,
      action,
      entity: entity || null,
      entity_id: entityId === undefined || entityId === null ? null : String(entityId),
      metadata: metadata || null,
      ip_address: req.ip || null,
      user_agent: req.get('user-agent')?.slice(0, 255) || null,
    });
  } catch (error) {
    console.error('Audit log failed:', error.message);
  }
}

module.exports = { logAudit };
