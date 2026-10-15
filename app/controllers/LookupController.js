// controllers/LookupController.js
const LookupService = require('../services/LookupService');

class LookupController {
  // GET /api/lookups/:type
  async getItems(req, res, next) {
    try {
      const { type } = req.params;
      const activeOnly = req.query.all !== 'true'; // إرجاع الفعالة فقط افتراضياً
      const items = await LookupService.getLookupItems(type, { activeOnly });
      return res.status(200).json({ success: true, data: items });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  // POST /api/lookups/:type
  async createItem(req, res, next) {
    try {
      const { type } = req.params;
      const newItem = await LookupService.createLookupItem(type, req.body, req.user?.id);
      return res.status(201).json({ success: true, data: newItem });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  // PATCH /api/lookups/:type/:id
  async updateItem(req, res, next) {
    try {
      const { type, id } = req.params;
      const updatedItem = await LookupService.updateLookupItem(type, id, req.body, req.user?.id);
      return res.status(200).json({ success: true, data: updatedItem });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  // PATCH /api/lookups/:type/:id/disable
  async disableItem(req, res, next) {
    try {
      const { type, id } = req.params;
      const disabledItem = await LookupService.disableLookupItem(type, id, req.user?.id);
      return res.status(200).json({ success: true, message: 'تم تعطيل العنصر بنجاح', data: disabledItem });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
}

module.exports = new LookupController();