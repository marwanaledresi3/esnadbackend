// controllers/RolePermissionController.js

const RolePermission = require('../models/RolePermission');
const apiResponse = require('../utils/apiResponse');

class RolePermissionController {
  // إسناد صلاحية إلى دور
  static async assign(req, res, next) {
    try {
      const { roleId } = req.params;
      const { permission_id } = req.body;

      if (!permission_id) {
        return res.status(400).json({
          success: false,
          message: 'معرّف الصلاحية مطلوب',
        });
      }

      const result = await RolePermission.assign({
        role_id: roleId,
        permission_id,
      });

      return apiResponse.success(
        res,
        'تم إسناد الصلاحية إلى الدور بنجاح',
        result
      );
    } catch (error) {
      next(error);
    }
  }

  // عرض صلاحيات دور
  static async getByRole(req, res, next) {
    try {
      const permissions = await RolePermission.findByRoleId(
        req.params.roleId
      );

      return apiResponse.success(
        res,
        'قائمة صلاحيات الدور',
        permissions
      );
    } catch (error) {
      next(error);
    }
  }

  // إلغاء صلاحية من دور
  static async remove(req, res, next) {
    try {
      const { roleId, permissionId } = req.params;

      const result = await RolePermission.remove(
        roleId,
        permissionId
      );

      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'الصلاحية غير مسندة إلى هذا الدور',
        });
      }

      return apiResponse.success(
        res,
        'تم إلغاء الصلاحية من الدور بنجاح',
        result
      );
    } catch (error) {
      next(error);
    }
  }

  // استبدال جميع صلاحيات دور
  static async replaceForRole(req, res, next) {
    try {
      const { roleId } = req.params;
      const { permission_ids } = req.body;

      if (
        !Array.isArray(permission_ids) ||
        permission_ids.some(
          (id) => typeof id !== 'string' || !id.trim()
        )
      ) {
        return res.status(400).json({
          success: false,
          message: 'يجب إرسال permission_ids كمصفوفة من معرّفات UUID',
        });
      }

      const permissions = await RolePermission.replaceForRole(
        roleId,
        permission_ids
      );

      return apiResponse.success(
        res,
        'تم تحديث صلاحيات الدور بنجاح',
        permissions
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = RolePermissionController;
