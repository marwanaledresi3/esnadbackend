// services/TransportRequestService.js
const {pool} = require('../config/db');
const TransportRequest = require('../models/TransportRequest');
const NotificationService = require('./NotificationService');

class TransportRequestService {
  static async list(filters) {
    return await TransportRequest.getAll(filters);
  }

  static async getById(id) {
    return await TransportRequest.getById(id);
  }

  static async createFull({
    requester_organization_id,
    receiving_organization_id,
    requested_for,
    origin_location,
    destination,
    transport_type,
    priority,
    reason,
    authorization_id,
    items = [],
    notes,
    requested_by,
  }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const number = await TransportRequest.generateNumber();

      const request = await TransportRequest.create({
        request_number: number,
        requester_organization_id,
        receiving_organization_id,
        requested_for,
        origin_location,
        destination,
        transport_type,
        priority,
        reason,
        authorization_id,
        status: 'pending',
        requested_by,
        notes,
      });

      for (const item of items) {
        await TransportRequest.addItem({
          transport_request_id: request.id,
          case_id: item.case_id || null,
          body_case_id: item.body_case_id || null,
          notes: item.notes || null,
        });
      }

      await client.query('COMMIT');
      return await TransportRequest.getById(request.id);
    } catch (e) {
      console.error('TransportRequestController.create', e);
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  static async approve(id, approvedBy) {
    const updated = await TransportRequest.updateStatus(id, 'approved', approvedBy);
    if (!updated) return null;
    // إشعار الجهة الطالبة
    if (updated.requester_organization_id) {
      await NotificationService.create({
        user_id: approvedBy, // أو مدير الجهة الطالبة
        organization_id: updated.requester_organization_id,
        notification_type_id: null,
        title: 'تم اعتماد طلب النقل',
        message: `تم اعتماد طلب النقل رقم ${updated.request_number}`,
        entity_type: 'transport_request',
        entity_id: updated.id,
        priority: 'normal',
      }).catch(() => {});
    }
    return updated;
  }

  static async reject(id, approvedBy) {
    return await TransportRequest.updateStatus(id, 'rejected', approvedBy);
  }

  static async cancel(id) {
    return await TransportRequest.updateStatus(id, 'cancelled');
  }

  static async update(id, data) {
    return await TransportRequest.update(id, data);
  }

  static async addItem(data) {
    return await TransportRequest.addItem(data);
  }

  static async deleteItem(itemId) {
    return await TransportRequest.deleteItem(itemId);
  }
}

module.exports = TransportRequestService;