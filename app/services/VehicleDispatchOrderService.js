// services/VehicleDispatchOrderService.js
const {pool} = require('../config/db');
const VehicleDispatchOrder = require('../models/VehicleDispatchOrder');

class VehicleDispatchOrderService {
  static async list(filters) {
    return await VehicleDispatchOrder.getAll(filters);
  }

  static async getById(id) {
    return await VehicleDispatchOrder.getById(id);
  }

  static async create(data, userId) {
    return await VehicleDispatchOrder.create({
      ...data,
      issued_by: userId,
    });
  }

  static async updateStatus(id, status) {
    return await VehicleDispatchOrder.updateStatus(id, status);
  }

  static async addTripEvent(data, userId) {
    return await VehicleDispatchOrder.addTripEvent({
      ...data,
      recorded_by: userId,
    });
  }

  static async delete(id) {
    return await VehicleDispatchOrder.delete(id);
  }
}

module.exports = VehicleDispatchOrderService;