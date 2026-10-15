
// controllers/PermissionController.js

const Permission = require('../models/Permission');
const apiResponse = require('../utils/apiResponse');

class PermissionController {
  // إنشاء صلاحية
  static async create(req, res, next) {
    try {
      const { code, name, description } = req.body;

      if (!code?.trim() || !name?.trim()) {
        return res.status(400).json({
          success: false,
          message: 'كود الصلاحية واسمها حقول مطلوبة',
        });
      }

      const permission = await Permission.create({
        code: code.trim(),
        name: name.trim(),
        description: description?.trim() || null,
      });

      return apiResponse.created(
        res,
        'تم إنشاء الصلاحية بنجاح',
        permission
      );
    } catch (error) {
      next(error);
    }
  }

  // عرض جميع الصلاحيات
  static async getAll(req, res, next) {
    try {
      const permissions = await Permission.findAll();

      return apiResponse.success(
        res,
        'قائمة الصلاحيات',
        permissions
      );
    } catch (error) {
      next(error);
    }
  }

  // عرض صلاحية بواسطة UUID
  static async getById(req, res, next) {
    try {
      const permission = await Permission.findById(
        req.params.permissionId
      );

      if (!permission) {
        return res.status(404).json({
          success: false,
          message: 'الصلاحية غير موجودة',
        });
      }

      return apiResponse.success(
        res,
        'تم جلب بيانات الصلاحية بنجاح',
        permission
      );
    } catch (error) {
      next(error);
    }
  }

  // تحديث صلاحية
  static async update(req, res, next) {
    try {
      const { permissionId } = req.params;
      const { code, name, description } = req.body;

      if (!code?.trim() || !name?.trim()) {
        return res.status(400).json({
          success: false,
          message: 'كود الصلاحية واسمها حقول مطلوبة',
        });
      }

      const permission = await Permission.update(
        permissionId,
        {
          code: code.trim(),
          name: name.trim(),
          description: description?.trim() || null,
        }
      );

      if (!permission) {
        return res.status(404).json({
          success: false,
          message: 'الصلاحية غير موجودة',
        });
      }

      return apiResponse.success(
        res,
        'تم تحديث الصلاحية بنجاح',
        permission
      );
    } catch (error) {
      next(error);
    }
  }

  // حذف صلاحية
  static async delete(req, res, next) {
    try {
      const permission = await Permission.delete(
        req.params.permissionId
      );

      if (!permission) {
        return res.status(404).json({
          success: false,
          message: 'الصلاحية غير موجودة',
        });
      }

      return apiResponse.success(
        res,
        'تم حذف الصلاحية بنجاح',
        permission
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = PermissionController;