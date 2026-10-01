const Department = require('../models/Department');
const apiResponse = require('../utils/apiResponse');
const ApiError = require('../errors/ApiError');

class DepartmentController {
  // 1. إضافة قسم جديد لمنشأة/مؤسسة معينة
  static async createDepartment(req, res, next) {
    try {
      const { organization_id, name, code } = req.body;

      if (!organization_id || !name) {
        throw ApiError.badRequest('يرجى تحديد المنشأة واسم القسم بشكل أساسي');
      }

      const department = await Department.create({ organization_id, name, code });
      return apiResponse.created(res, 'تم إضافة القسم بنجاح', department);
    } catch (error) {
      next(error);
    }
  }

  // 2. عرض جميع الأقسام التابعة لمنشأة محددة
  static async getDepartmentsByOrganization(req, res, next) {
    try {
      const { organizationId } = req.params;

      if (!organizationId) {
        throw ApiError.badRequest('معرف المنشأة مطلوب');
      }

      const departments = await Department.findByOrganization(organizationId);
      return apiResponse.success(res, 'قائمة الأقسام التابعة للمنشأة', departments);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = DepartmentController;