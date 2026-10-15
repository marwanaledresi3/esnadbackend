const SharedRecord = require('../models/SharedRecord');
const OrganizationLink = require('../models/OrganizationLink');
const DataSharingRule = require('../models/DataSharingRule');
const auditLogger = require('../utils/auditLogger');
const ApiError = require('../errors/ApiError');

class DataSharingService {
  // مشاركة سجل مع جهة أخرى
  static async shareRecord({ entityType, entityId, targetOrganizationId, actingUser }) {
    const { id: userId, currentOrganizationId: userOrgId } = actingUser;

    // 1. التحقق من الملكية
    const isOwner = await SharedRecord.verifyOwnership(entityType, entityId, userOrgId);
    if (!isOwner) {
      throw ApiError.forbidden('لا يمكنك مشاركة مورد لا تملكه جهتك الأصلية');
    }

    // 2. التحقق من الربط الفعال
    const activeLink = await OrganizationLink.findActiveLink(userOrgId, targetOrganizationId);
    if (!activeLink) {
      throw ApiError.badRequest('لا توجد علاقة ربط معتمدة وفعالة مع الجهة المستهدفة');
    }

    // 3. التحقق من قواعد المشاركة
    const ruleActive = await DataSharingRule.isRuleActive(activeLink.id, entityType);
    if (!ruleActive) {
      throw ApiError.badRequest(`قواعد المشاركة الحالية لا تسمح بنقل موارد من نوع ${entityType}`);
    }

    // 4. منع المشاركة المكررة النشطة
    const existingShare = await SharedRecord.findActiveShare(entityType, entityId, targetOrganizationId);
    if (existingShare) {
      throw ApiError.badRequest('تمت مشاركة هذا السجل بالفعل مع الجهة المستهدفة وهو فعال حالياً');
    }

    // 5. إنشاء السجل
    const sharedRecord = await SharedRecord.create({
      entityType,
      entityId,
      ownerOrganizationId: userOrgId,
      sharedWithOrganizationId: targetOrganizationId,
      sharedByUserId: userId
    });

    await auditLogger.log({
      userId,
      organizationId: userOrgId,
      actionType: 'RECORD_SHARED',
      entityType,
      entityId,
      newValues: { targetOrganizationId, sharedRecordId: sharedRecord.id }
    });

    return sharedRecord;
  }

  // سحب/إلغاء مشاركة سجل
  static async revokeSharing({ shareId, reason, actingUser }) {
    const { id: userId, currentOrganizationId: userOrgId } = actingUser;

    const revokedRecord = await SharedRecord.revoke(shareId, userId, reason);
    if (!revokedRecord) {
      throw ApiError.notFound('سجل المشاركة غير موجود أو تم سحبه سابقاً');
    }

    await auditLogger.log({
      userId,
      organizationId: userOrgId,
      actionType: 'RECORD_SHARE_REVOKED',
      entityType: revokedRecord.entity_type,
      entityId: revokedRecord.entity_id,
      newValues: { shareId, reason }
    });

    return revokedRecord;
  }
}

module.exports = DataSharingService;