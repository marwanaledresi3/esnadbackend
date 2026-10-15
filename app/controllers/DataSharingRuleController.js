const DataSharingRule = require('../models/DataSharingRule');
const apiResponse = require('../utils/apiResponse');

class DataSharingRuleController {
  static async upsertRule(req, res, next) {
    try {
      const { organization_link_id, entity_type, permission_type, is_active } = req.body;

      const result = await DataSharingRule.upsertRule({
        organizationLinkId: organization_link_id,
        entityType: entity_type,
        permissionType: permission_type,
        isActive: is_active
      });

      return apiResponse.success(res, 'تم حفظ قاعدة مشاركة البيانات بنجاح', result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = DataSharingRuleController;