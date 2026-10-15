// controllers/PersonController.js
const PersonService = require('../services/PersonService');

class PersonController {
  static async getAll(req, res) {
    try {
      const {
        search,
        gender,
        identity_status,
        national_id,
        limit,
        offset,
      } = req.query;

      const items = await PersonService.list({
        search,
        gender,
        identity_status,
        national_id,
        limit: limit ? Number(limit) : 100,
        offset: offset ? Number(offset) : 0,
      });

      return res.json({
        success: true,
        message: 'قائمة الأشخاص',
        data: items,
      });
    } catch (error) {
      console.error('PersonController.getAll', error);
      return res.status(500).json({
        success: false,
        message: 'تعذر جلب قائمة الأشخاص',
      });
    }
  }

  static async getById(req, res) {
    try {
      const item = await PersonService.getById(req.params.id);
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'الشخص غير موجود',
        });
      }
      return res.json({ success: true, data: item });
    } catch (error) {
      console.error('PersonController.getById', error);
      return res.status(500).json({
        success: false,
        message: 'تعذر جلب الشخص',
      });
    }
  }

  static async create(req, res) {
    try {
      const {
        full_name,
        first_name,
        father_name,
        grandfather_name,
        family_name,
        gender,
        date_of_birth,
        national_id,
        phone,
        address,
        identity_status,
      } = req.body;

      if (!first_name && !full_name) {
        return res.status(400).json({
          success: false,
          message: 'الاسم الأول أو الاسم الكامل مطلوب',
        });
      }

      const created = await PersonService.create(
        {
          full_name,
          first_name,
          father_name,
          grandfather_name,
          family_name,
          gender,
          date_of_birth,
          national_id,
          phone,
          address,
          identity_status: identity_status || 'known',
        },
        req.user?.id,
      );

      return res.status(201).json({
        success: true,
        message: 'تم إنشاء الشخص بنجاح',
        data: created,
      });
    } catch (error) {
      console.error('PersonController.create', error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'تعذر إنشاء الشخص',
      });
    }
  }

  static async update(req, res) {
    try {
      const updated = await PersonService.update(
        req.params.id,
        req.body,
        req.user?.id,
      );
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'الشخص غير موجود أو لا توجد حقول للتحديث',
        });
      }
      return res.json({
        success: true,
        message: 'تم تحديث بيانات الشخص',
        data: updated,
      });
    } catch (error) {
      console.error('PersonController.update', error);
      return res.status(500).json({
        success: false,
        message: 'تعذر تحديث الشخص',
      });
    }
  }

  static async delete(req, res) {
    try {
      const ok = await PersonService.delete(req.params.id);
      if (!ok) {
        return res.status(404).json({
          success: false,
          message: 'الشخص غير موجود',
        });
      }
      return res.json({
        success: true,
        message: 'تم حذف الشخص',
      });
    } catch (error) {
      console.error('PersonController.delete', error);
      return res.status(500).json({
        success: false,
        message: 'تعذر حذف الشخص',
      });
    }
  }

  static async count(req, res) {
    try {
      const total = await PersonService.count();
      return res.json({ success: true, data: { total } });
    } catch (error) {
      console.error('PersonController.count', error);
      return res.status(500).json({
        success: false,
        message: 'تعذر جلب الإحصائيات',
      });
    }
  }
}

module.exports = PersonController;