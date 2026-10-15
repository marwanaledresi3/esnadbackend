// controllers/VehicleDispatchOrderController.js
const VehicleDispatchOrderService = require('../services/VehicleDispatchOrderService');

class VehicleDispatchOrderController {
  static async getAll(req, res) {
    try {
      const { status, hospital_id, transport_request_id, limit, offset } = req.query;
      const items = await VehicleDispatchOrderService.list({
        status, hospital_id, transport_request_id,
        limit: limit ? Number(limit) : 100,
        offset: offset ? Number(offset) : 0,
      });
      return res.json({ success: true, message: 'أوامر خروج السيارات', data: items });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ success: false, message: 'تعذر الجلب' });
    }
  }

  static async getById(req, res) {
    try {
      const item = await VehicleDispatchOrderService.getById(req.params.id);
      if (!item) return res.status(404).json({ success: false, message: 'غير موجود' });
      return res.json({ success: true, data: item });
    } catch (e) {
      return res.status(500).json({ success: false, message: 'تعذر الجلب' });
    }
  }

  static async create(req, res) {
    try {
      const {
        transport_request_id, hospital_id, ambulance_id,
        driver_id, nurse_id, destination_location,
        mission_type, departure_at, expected_return_at, notes,
      } = req.body;

      if (!transport_request_id || !hospital_id || !ambulance_id ||
          !driver_id || !nurse_id || !destination_location || !mission_type) {
        return res.status(400).json({
          success: false,
          message: 'الحقول الأساسية مطلوبة',
        });
      }

      const created = await VehicleDispatchOrderService.create(
        {
          transport_request_id, hospital_id, ambulance_id,
          driver_id, nurse_id, destination_location,
          mission_type, departure_at, expected_return_at, notes,
        },
        req.user?.id,
      );

      return res.status(201).json({ success: true, message: 'تم الإصدار', data: created });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ success: false, message: 'تعذر الإصدار' });
    }
  }

  static async updateStatus(req, res) {
    try {
      const { status } = req.body;
      const updated = await VehicleDispatchOrderService.updateStatus(req.params.id, status);
      if (!updated) return res.status(404).json({ success: false, message: 'غير موجود' });
      return res.json({ success: true, data: updated });
    } catch (e) {
      return res.status(500).json({ success: false, message: 'تعذر التحديث' });
    }
  }

  static async addTripEvent(req, res) {
    try {
      const event = await VehicleDispatchOrderService.addTripEvent(
        { dispatch_order_id: req.params.id, ...req.body },
        req.user?.id,
      );
      return res.status(201).json({ success: true, data: event });
    } catch (e) {
      return res.status(500).json({ success: false, message: 'تعذر الإضافة' });
    }
  }

  static async delete(req, res) {
    try {
      const ok = await VehicleDispatchOrderService.delete(req.params.id);
      if (!ok) return res.status(404).json({ success: false, message: 'غير موجود' });
      return res.json({ success: true, message: 'تم الحذف' });
    } catch (e) {
      return res.status(500).json({ success: false, message: 'تعذر الحذف' });
    }
  }
}

module.exports = VehicleDispatchOrderController;