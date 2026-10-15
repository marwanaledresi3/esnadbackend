// controllers/OrganizationController.js
const Organization = require('../models/Organization');
const apiResponse = require('../utils/apiResponse');

class OrganizationController {
  static async create(req, res, next) {
    try {
      const org = await Organization.create(req.body);
      return apiResponse.created(res, 'تم إضافة المنشأة بنجاح', org);
    } catch (error) { next(error); }
  }

  static async getAll(req, res, next) {
    try {
      const orgs = await Organization.findAll();
      return apiResponse.success(res, 'قائمة المنشآت والمؤسسات', orgs);
    } catch (error) { next(error); }
  }

  static async getOrganizations(req, res, next) {
    try {
      const { search, status, type } = req.query;
      const orgs = await Organization.getOrganizations({ search, status, type });
      return apiResponse.success(res, 'قائمة المنشآت والمؤسسات', orgs);
    } catch (error) { next(error); }
  }
  static async updateOrganizationStatus(req, res, next) {
    try {
      const { organizationId } = req.params;
      const { status } = req.body;
      const updatedOrg = await Organization.updateOrganizationStatus(organizationId, status);
      return apiResponse.success(res, 'تم تحديث حالة المنشأة بنجاح', updatedOrg);
    } catch (error) {
      next(error);
    }
  }
  static async deleteOrganization(req, res, next) {
    try {
      const { organizationId } = req.params;
      const deletedOrg = await Organization.deleteOrganization(organizationId);
      return apiResponse.success(res, 'تم حذف المنشأة بنجاح', deletedOrg);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = OrganizationController;