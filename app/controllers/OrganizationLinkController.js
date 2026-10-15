const OrganizationLinkService = require('../services/OrganizationLinkService');
const apiResponse = require('../utils/apiResponse');

class OrganizationLinkController {
  static async create(req, res, next) {
    try {
      const { source_organization_id, target_organization_id, link_type } = req.body;

      const result = await OrganizationLinkService.createLink({
        sourceOrganizationId: source_organization_id,
        targetOrganizationId: target_organization_id,
        linkType: link_type,
        actingUser: { ...req.user, currentOrganizationId: req.currentOrganizationId }
      });

      return apiResponse.created(res, 'تم طلب إنشاء علاقة الربط بين الجهتين بنجاح', result);
    } catch (error) {
      next(error);
    }
  }

  static async approve(req, res, next) {
    try {
      const { id } = req.params;

      const result = await OrganizationLinkService.approveLink({
        linkId: id,
        actingUser: { ...req.user, currentOrganizationId: req.currentOrganizationId }
      });

      return apiResponse.success(res, 'تم اعتماد وتفعيل علاقة الربط بين الجهتين', result);
    } catch (error) {
      next(error);
    }
  }

   static async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const result = await OrganizationLinkService.updateLinkStatus({
        linkId: id,
        status,
        actingUser: { ...req.user, currentOrganizationId: req.currentOrganizationId }
      });

      return apiResponse.success(res, 'تم تحديث حالة علاقة الربط بين الجهتين', result);
    } catch (error) {
      next(error);
    }
  }
  static async getOrganizationLinks(req, res, next) {
    try {
      const { status, sourceOrgId, targetOrgId } = req.query;

      const result = await OrganizationLinkService.getOrganizationLinks({
        status,
        sourceOrgId,
        targetOrgId,
        actingUser: { ...req.user, currentOrganizationId: req.currentOrganizationId }
      });

      return apiResponse.success(res, 'تم جلب علاقات الربط بين الجهتين', result);
    } catch (error) {
      next(error);
    }
  }
  static async findActiveLink(req, res, next) {
    try {
      const { sourceOrgId, targetOrgId } = req.query;

      const result = await OrganizationLinkService.findActiveLink({
        sourceOrgId,
        targetOrgId,
        actingUser: { ...req.user, currentOrganizationId: req.currentOrganizationId }
      });

      return apiResponse.success(res, 'تم جلب علاقة الربط النشطة بين الجهتين', result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = OrganizationLinkController;