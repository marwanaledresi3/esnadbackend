// services/StorageLocationService.js
const StorageLocation = require('../models/StorageLocation');

class StorageLocationService {
  static async list(filters) {
    return await StorageLocation.getAll(filters);
  }

  static async getById(id) {
    return await StorageLocation.getById(id);
  }

  static async create(data) {
    if (!data.organization_id || !data.name || !data.location_type) {
      const err = new Error('organization_id و name و location_type مطلوبة');
      err.statusCode = 400;
      throw err;
    }
    return await StorageLocation.create(data);
  }

  static async update(id, data) {
    return await StorageLocation.update(id, data);
  }

  static async changeStatus(id, status) {
    return await StorageLocation.changeStatus(id, status);
  }

  static async delete(id) {
    return await StorageLocation.delete(id);
  }

  static async count() {
    return await StorageLocation.count();
  }
}

module.exports = StorageLocationService;