
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const apiResponse = require('../utils/apiResponse');

class UserController {
  // جلب قائمة المستخدمين
  static async getAll(req, res, next) {
    try {
      const {
        role_code,
        limit = 20,
        offset = 0,
      } = req.query;

      const organizationId = req.currentOrganizationId;
 
      const users = await User.findAll({
        organization_id: organizationId,
        role_code,
        limit: Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100),
        offset: Math.max(parseInt(offset, 10) || 0, 0),
      });

      return apiResponse.success(
        res,
        'تم جلب قائمة المستخدمين بنجاح',
        users
      );
    } catch (error) {
      next(error);
    }
  }

  // جلب مستخدم بواسطة المعرف
  static async getById(req, res, next) {
    try {
      const { id } = req.params;

      const user = await User.findById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'المستخدم غير موجود',
        });
      }

      // منع عرض مستخدم تابع لجهة أخرى
      if (
        !req.user?.is_system_admin &&
        user.organization_id !== req.currentOrganizationId
      ) {
        return res.status(403).json({
          success: false,
          message: 'ليس لديك صلاحية لعرض هذا المستخدم',
        });
      }

      return apiResponse.success(
        res,
        'تم جلب بيانات المستخدم بنجاح',
        user
      );
    } catch (error) {
      next(error);
    }
  }

  // إنشاء مستخدم جديد
  static async create(req, res, next) {
    try {
      const {
        organization_id,
        username,
        password,
        full_name,
        role_code,
        phone,
      } = req.body;

      const targetOrganizationId =
        req.user?.is_system_admin && organization_id
          ? organization_id
          : req.currentOrganizationId;

      if (!targetOrganizationId) {
        return res.status(400).json({
          success: false,
          message: 'يجب تحديد الجهة التي سينتمي إليها المستخدم',
        });
      }

      if (!username || !password || !full_name || !role_code) {
        return res.status(400).json({
          success: false,
          message: 'اسم المستخدم وكلمة المرور والاسم الكامل والصلاحية مطلوبة',
        });
      }

      if (String(password).length < 8) {
        return res.status(400).json({
          success: false,
          message: 'يجب أن تتكون كلمة المرور من 8 أحرف على الأقل',
        });
      }

      // التحقق من عدم تكرار اسم المستخدم
      const existingUser = await User.findByUsername(username);

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'اسم المستخدم مستخدم بالفعل',
        });
      }

      const password_hash = await bcrypt.hash(password, 12);

      const user = await User.create({
        organization_id: targetOrganizationId,
        username,
        password_hash,
        full_name,
        role_code,
        phone,
      });

      return apiResponse.created(
        res,
        'تم إنشاء المستخدم بنجاح',
        user
      );
    } catch (error) {
      next(error);
    }
  }

  // تفعيل أو تعطيل حساب مستخدم
  static async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['active', 'inactive'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'الحالة يجب أن تكون active أو inactive',
        });
      }

      const existingUser = await User.findById(id);

      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'المستخدم غير موجود',
        });
      }

      if (
        !req.user?.is_system_admin &&
        existingUser.organization_id !== req.currentOrganizationId
      ) {
        return res.status(403).json({
          success: false,
          message: 'ليس لديك صلاحية لتعديل هذا المستخدم',
        });
      }

      const updatedUser = await User.updateStatus(id, status);

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: 'تعذر تحديث حالة المستخدم',
        });
      }

      return apiResponse.success(
        res,
        'تم تحديث حالة الحساب بنجاح',
        updatedUser
      );
    } catch (error) {
      next(error);
    }
  }

  // حذف مستخدم
  static async delete(req, res, next) {
    try {
      const { id } = req.params;

      const existingUser = await User.findById(id);

      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'المستخدم غير موجود',
        });
      }

      if (
        !req.user?.is_system_admin &&
        existingUser.organization_id !== req.currentOrganizationId
      ) {
        return res.status(403).json({
          success: false,
          message: 'ليس لديك صلاحية لحذف هذا المستخدم',
        });
      }

      // منع حذف الحساب المستخدم حاليًا
      if (req.user?.id === id) {
        return res.status(400).json({
          success: false,
          message: 'لا يمكنك حذف حسابك الحالي',
        });
      }

      await User.delete(id);

      return apiResponse.success(
        res,
        'تم حذف المستخدم بنجاح',
        { id }
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UserController;
