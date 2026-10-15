// controllers/RoleController.js

const Role = require('../models/Role');
const apiResponse = require('../utils/apiResponse');

class RoleController {
  // إنشاء دور
  static async create(req, res, next) {
    try {
      const { name, description, status = 'active' } = req.body;

      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'اسم الدور مطلوب',
        });
      }

      if (!['active', 'inactive'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'حالة الدور يجب أن تكون active أو inactive',
        });
      }

      const existingRole = await Role.findByName(name.trim());

      if (existingRole) {
        return res.status(409).json({
          success: false,
          message: 'اسم الدور موجود بالفعل',
        });
      }

      const role = await Role.create({
        name: name.trim(),
        description:
          typeof description === 'string'
            ? description.trim() || null
            : null,
        status,
      });

      return apiResponse.created(
        res,
        'تم إنشاء الدور بنجاح',
        role
      );
    } catch (error) {
      next(error);
    }
  }

  // عرض جميع الأدوار
  static async getAll(req, res, next) {
    try {
      const roles = await Role.findAll();

      return apiResponse.success(
        res,
        'قائمة الأدوار',
        roles
      );
    } catch (error) {
      next(error);
    }
  }

  // عرض الأدوار النشطة
  static async getActive(req, res, next) {
    try {
      const roles = await Role.findActive();

      return apiResponse.success(
        res,
        'قائمة الأدوار النشطة',
        roles
      );
    } catch (error) {
      next(error);
    }
  }

  // عرض دور بواسطة UUID
  static async getById(req, res, next) {
    try {
      const { roleId } = req.params;

      if (!RoleController.isValidUUID(roleId)) {
        return res.status(400).json({
          success: false,
          message: 'معرّف الدور غير صالح',
        });
      }

      const role = await Role.findById(roleId);

      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'الدور غير موجود',
        });
      }

      return apiResponse.success(
        res,
        'تم جلب بيانات الدور بنجاح',
        role
      );
    } catch (error) {
      next(error);
    }
  }

  // تحديث دور
  static async update(req, res, next) {
    try {
      const { roleId } = req.params;
      const { name, description, status } = req.body;

      if (!RoleController.isValidUUID(roleId)) {
        return res.status(400).json({
          success: false,
          message: 'معرّف الدور غير صالح',
        });
      }

      const existingRole = await Role.findById(roleId);

      if (!existingRole) {
        return res.status(404).json({
          success: false,
          message: 'الدور غير موجود',
        });
      }

      const updatedName =
        name === undefined ? existingRole.name : name;

      const updatedDescription =
        description === undefined
          ? existingRole.description
          : description;

      const updatedStatus =
        status === undefined ? existingRole.status : status;

      if (
        typeof updatedName !== 'string' ||
        !updatedName.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: 'اسم الدور مطلوب',
        });
      }

      if (
        updatedDescription !== null &&
        typeof updatedDescription !== 'string'
      ) {
        return res.status(400).json({
          success: false,
          message: 'وصف الدور يجب أن يكون نصًا أو null',
        });
      }

      if (!['active', 'inactive'].includes(updatedStatus)) {
        return res.status(400).json({
          success: false,
          message: 'حالة الدور يجب أن تكون active أو inactive',
        });
      }

      const normalizedName = updatedName.trim();

      const duplicateRole = await Role.findByName(normalizedName);

      if (duplicateRole && duplicateRole.id !== roleId) {
        return res.status(409).json({
          success: false,
          message: 'اسم الدور مستخدم من قبل',
        });
      }

      const role = await Role.update(roleId, {
        name: normalizedName,
        description:
          typeof updatedDescription === 'string'
            ? updatedDescription.trim() || null
            : null,
        status: updatedStatus,
      });

      return apiResponse.success(
        res,
        'تم تحديث الدور بنجاح',
        role
      );
    } catch (error) {
      next(error);
    }
  }

  // حذف دور
  static async delete(req, res, next) {
    try {
      const { roleId } = req.params;

      if (!RoleController.isValidUUID(roleId)) {
        return res.status(400).json({
          success: false,
          message: 'معرّف الدور غير صالح',
        });
      }

      const role = await Role.findById(roleId);

      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'الدور غير موجود',
        });
      }

      const deletedRole = await Role.delete(roleId);

      return apiResponse.success(
        res,
        'تم حذف الدور بنجاح',
        deletedRole
      );
    } catch (error) {
      // PostgreSQL: الدور مرتبط بسجلات أخرى
      if (error.code === '23503') {
        return res.status(409).json({
          success: false,
          message:
            'لا يمكن حذف الدور لأنه مرتبط بمستخدمين أو صلاحيات',
        });
      }

      next(error);
    }
  }

  // التحقق من صيغة UUID
  static isValidUUID(value) {
    return (
      typeof value === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        value
      )
    );
  }
}

module.exports = RoleController;