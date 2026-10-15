// middlewares/auditMiddleware.js
const AuditLogModel = require('../models/AuditLog');

/**
// دالة مساعدة لاستدعائها داخل المتحكمات لتسجيل الأحداث الحساسة
*/
const logAuditEvent = async (req, { actionType, entityType, entityId, oldValues = null, newValues = null }, client = null) => {
  try {
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const userId = req.user ? req.user.id : null;
    const organizationId = req.currentOrganizationId || null;

    await AuditLogModel.log({
      user_id: userId,
      organization_id: organizationId,
      action_type: actionType,
      entity_type: entityType,
      entity_id: entityId,
      old_values: oldValues,
      new_values: newValues,
      ip_address: ipAddress,
      user_agent: userAgent
    }, client);
  } catch (error) {
    // تسجيل الخطأ دون إيقاف تنفيذ المعاملة الأساسية
    console.error('[Audit Log Failure]:', error);
  }
};

module.exports = { logAuditEvent };