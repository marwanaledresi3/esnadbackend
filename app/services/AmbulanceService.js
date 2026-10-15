// services/AmbulanceService.js
const Ambulance = require('../models/Ambulance');

class AmbulanceService {
  static async list(filters) {
    return await Ambulance.getAll(filters);
  }

  static async getById(id) {
    return await Ambulance.getById(id);
  }

  static async create(data) {
    // تحقق من تكرار الكود
    const existing = await Ambulance.getByCode(data.vehicle_code);
    if (existing) {
      const err = new Error(`كود السيارة ${data.vehicle_code} مستخدم بالفعل`);
      err.statusCode = 409;
      throw err;
    }

    return await Ambulance.create(data);
  }

  static async update(id, data) {
    return await Ambulance.update(id, data);
  }

  static async changeStatus(id, status) {
    return await Ambulance.changeStatus(id, status);
  }

  static async delete(id) {
    // تحقق من وجود مهام مرتبطة
    // يمكن تفعيل هذا لاحقاً
    return await Ambulance.delete(id);
  }

  static async count() {
    return await Ambulance.count();
  }
}

module.exports = AmbulanceService;