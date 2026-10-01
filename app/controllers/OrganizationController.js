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
}

module.exports = OrganizationController;