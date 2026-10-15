const AccountRequestService = require('../services/AccountRequestService');
const apiResponse = require('../utils/apiResponse');
const bcrypt = require('bcrypt');

async function hashPassword(password) {
    const password_hash = await bcrypt.hash(req.body.password, 12);
    return password_hash;
}
class AccountRequestController {
  static async getRequests(req, res, next) {
    try {
      const { status } = req.query;
      let currentUserId = null ;
      if (req.user && !req.user.is_system_admin) {
        currentUserId = req.user.id;
      }
      const organizationId = req.currentOrganizationId; // تم تحديده عبر organizationMiddleware[cite: 5]

      const requests = await AccountRequestService.getRequestsList({
        organizationId,
        status: status || 'pending',
      });

      return apiResponse.success(
        res,
        'تم جلب قائمة طلبات الحسابات بنجاح',
        requests
      );
    } catch (error) {
console.log('data...',error);
      next(error);
    }
  }
  static async submit(req, res, next) {
    
    try {
      const requestData = {
        fullName: req.body.full_name,
        username: req.body.username,
        passwordHash: await bcrypt.hash(req.body.password, 12),
        phoneNumber: req.body.phone_number,
        email: req.body.email,
        jobTitle: req.body.jobTitle,
        organizationId: req.body.organization_id,
        provinceId: req.body.province_id,
        requestReason: req.body.request_reason
      };

      const result = await AccountRequestService.submitRequest(requestData);
      return apiResponse.created(res, 'تم تقديم طلب الحساب بنجاح، وهو قيد المراجعة', result);
    } catch (error) {
      next(error);
    }
  }

  static async approve(req, res, next) {
    try {
      const { id } = req.params;
      const { role_id } = req.body;

     
      const result = await AccountRequestService.approveRequest({
        requestId: id,
        reviewedByUserId: req.user.id,
        reviewerOrgId: req.currentOrganizationId,
        roleId: role_id,
        isSystemAdmin: req.user.is_system_admin
      });

      return apiResponse.success(res, 'تمت الموافقة على طلب الحساب وإنشاء العضوية بنجاح', result);
    } catch (error) {
      next(error);
    }
  }

  static async reject(req, res, next) {
    try {
      const { id } = req.params;
      const { rejection_reason } = req.body;

      const result = await AccountRequestService.rejectRequest({
        requestId: id,
        reviewedByUserId: req.user.id,
        reviewerOrgId: req.currentOrganizationId,
        rejectionReason: rejection_reason,
        isSystemAdmin: req.user.is_system_admin
      });

      return apiResponse.success(res, 'تم رفض طلب الحساب بنجاح', result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AccountRequestController;