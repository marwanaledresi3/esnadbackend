const OrganizationMembershipService = require('../services/OrganizationMembershipService');
const apiResponse = require('../utils/apiResponse');

class OrganizationMembershipController {
  static async updateStatus(req, res, next) {
    try {
      const { userId } = req.params;
      const { status, organization_id } = req.body;

      const result = await OrganizationMembershipService.updateMembershipStatus({
        targetUserId: userId,
        targetOrgId: organization_id || req.currentOrganizationId,
        newStatus: status,
        actingUserId: req.user.id,
        actingOrgId: req.currentOrganizationId,
        isSystemAdmin: req.user.is_system_admin
      });

      return apiResponse.success(res, 'تم تحديث حالة العضوية بنجاح', result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = OrganizationMembershipController;