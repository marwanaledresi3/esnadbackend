// controllers/TransportRequestController.js
const TransportRequestService = require('../services/TransportRequestService');

class TransportRequestController {
  static async getAll(req, res) {
    try {
      const {
        status,
        requester_organization_id,
        receiving_organization_id,
        transport_type,
        priority,
        from_date,
        to_date,
        limit,
        offset,
      } = req.query;

      const items = await TransportRequestService.list({
        status,
        requester_organization_id,
        receiving_organization_id,
        transport_type,
        priority,
        from_date,
        to_date,
        limit: limit ? Number(limit) : 100,
        offset: offset ? Number(offset) : 0,
      });

      return res.json({
        success: true,
        message: 'قائمة طلبات النقل',
        data: items,
      });
    } catch (error) {
      console.error('TransportRequestController.getAll', error);
      return res.status(500).json({
        success: false,
        message: 'تعذر جلب طلبات النقل',
      });
    }
  }

  static async getById(req, res) {
    try {
      const item = await TransportRequestService.getById(req.params.id);
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'طلب النقل غير موجود',
        });
      }
      return res.json({ success: true, data: item });
    } catch (error) {
      console.error('TransportRequestController.getById', error);
      return res.status(500).json({
        success: false,
        message: 'تعذر جلب طلب النقل',
      });
    }
  }

  static async create(req, res) {
    try {
      const {
        requester_organization_id,
        receiving_organization_id,
        requested_for,
        origin_location,
        destination,
        transport_type,
        priority,
        reason,
        authorization_id,
        items,
        notes,
      } = req.body;

      if (!requester_organization_id || !transport_type) {
        return res.status(400).json({
          success: false,
          message: 'requester_organization_id و transport_type مطلوبة',
        });
      }

      const created = await TransportRequestService.createFull({
        requester_organization_id,
        receiving_organization_id,
        requested_for,
        origin_location,
        destination,
        transport_type,
        priority,
        reason,
        authorization_id,
        items: Array.isArray(items) ? items : [],
        notes,
        requested_by: req.user?.id,
      });

      return res.status(201).json({
        success: true,
        message: 'تم إنشاء طلب النقل بنجاح',
        data: created,
      });
    } catch (error) {
      console.error('TransportRequestController.create', error);
      return res.status(500).json({
        success: false,
        message: 'تعذر إنشاء طلب النقل',
      });
    }
  }

  static async approve(req, res) {
    try {
      const updated = await TransportRequestService.approve(
        req.params.id,
        req.user.id,
      );
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'طلب النقل غير موجود',
        });
      }
      return res.json({
        success: true,
        message: 'تم اعتماد طلب النقل',
        data: updated,
      });
    } catch (error) {
      console.error('TransportRequestController.approve', error);
      return res.status(500).json({
        success: false,
        message: 'تعذر اعتماد الطلب',
      });
    }
  }

  static async reject(req, res) {
    try {
      const updated = await TransportRequestService.reject(
        req.params.id,
        req.user.id,
      );
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'طلب النقل غير موجود',
        });
      }
      return res.json({
        success: true,
        message: 'تم رفض طلب النقل',
        data: updated,
      });
    } catch (error) {
      console.error('TransportRequestController.reject', error);
      return res.status(500).json({
        success: false,
        message: 'تعذر رفض الطلب',
      });
    }
  }

  static async cancel(req, res) {
    try {
      const updated = await TransportRequestService.cancel(req.params.id);
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'طلب النقل غير موجود',
        });
      }
      return res.json({
        success: true,
        message: 'تم إلغاء طلب النقل',
        data: updated,
      });
    } catch (error) {
      console.error('TransportRequestController.cancel', error);
      return res.status(500).json({
        success: false,
        message: 'تعذر إلغاء الطلب',
      });
    }
  }

  static async update(req, res) {
    try {
      const updated = await TransportRequestService.update(
        req.params.id,
        req.body,
      );
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'طلب النقل غير موجود أو لا توجد حقول للتحديث',
        });
      }
      return res.json({
        success: true,
        message: 'تم تحديث الطلب',
        data: updated,
      });
    } catch (error) {
      console.error('TransportRequestController.update', error);
      return res.status(500).json({
        success: false,
        message: 'تعذر تحديث الطلب',
      });
    }
  }

  static async addItem(req, res) {
    try {
      const { transport_request_id, case_id, body_case_id, notes } = req.body;
      if (!transport_request_id) {
        return res.status(400).json({
          success: false,
          message: 'transport_request_id مطلوب',
        });
      }
      const item = await TransportRequestService.addItem({
        transport_request_id,
        case_id,
        body_case_id,
        notes,
      });
      return res.status(201).json({ success: true, data: item });
    } catch (error) {
      console.error('TransportRequestController.addItem', error);
      return res.status(500).json({
        success: false,
        message: 'تعذر إضافة العنصر',
      });
    }
  }

  static async deleteItem(req, res) {
    try {
      const ok = await TransportRequestService.deleteItem(req.params.itemId);
      if (!ok) {
        return res.status(404).json({
          success: false,
          message: 'العنصر غير موجود',
        });
      }
      return res.json({ success: true, message: 'تم حذف العنصر' });
    } catch (error) {
      console.error('TransportRequestController.deleteItem', error);
      return res.status(500).json({
        success: false,
        message: 'تعذر حذف العنصر',
      });
    }
  }
}

module.exports = TransportRequestController;