// services/NotificationService.js
const Notification = require('../models/Notification');

class NotificationService {
  static async list(filters) {
    return await Notification.getAll(filters);
  }

  static async getById(id) {
    return await Notification.getById(id);
  }

  static async create(data) {
    return await Notification.create(data);
  }

  static async markAsRead(id) {
    return await Notification.markAsRead(id);
  }

  static async markAllAsRead(userId) {
    return await Notification.markAllAsRead(userId);
  }

  static async close(id, closedBy) {
    return await Notification.close(id, closedBy);
  }

  static async unreadCount(userId) {
    return await Notification.unreadCount(userId);
  }

  static async delete(id) {
    return await Notification.delete(id);
  }
}

module.exports = NotificationService;