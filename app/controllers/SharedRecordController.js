const DataSharingService = require('../services/DataSharingService');
const apiResponse = require('../utils/apiResponse');

class SharedRecordController {
  static async share(req, res, next) {
    try {
      const { entity_type, entity_id, target_organization_id } = req.body;

      const result = await DataSharingService.shareRecord({
        entityType: entity_type,
        entityId: entity_id,
        targetOrganizationId: target_organization_id,
        actingUser: { ...req.user, currentOrganizationId: req.currentOrganizationId }
      });

      return apiResponse.created(res, 'تمت مشاركة السجل مع الجهة المستهدفة بنجاح', result);
    } catch (error) {
      next(error);
    }
  }

  static async revoke(req, res, next) {
    try {
      const { shareId } = req.params;
      const { reason } = req.body;

      const result = await DataSharingService.revokeSharing({
        shareId,
        reason,
        actingUser: { ...req.user, currentOrganizationId: req.currentOrganizationId }
      });

      return apiResponse.success(res, 'تم إلغاء سحب مشاركة السجل بنجاح', result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = SharedRecordController;