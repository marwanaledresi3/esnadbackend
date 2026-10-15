const express = require('express');
const router = express.Router();

const AccountRequestController = require('../controllers/AccountRequestController');

const authMiddleware = require('../middlewares/authMiddleware');
const organizationMiddleware = require('../middlewares/organizationMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

const {
  createAccountRequestValidation,
  approveAccountRequestValidation,
} = require('../validators/accountRequestValidator');

// 1. تقديم طلب إنشاء حساب (لا يحتاج توثيق)
router.post(
  '/',
  createAccountRequestValidation,
  AccountRequestController.submit
);

// =====================================================
// 3. استعراض قائمة طلبات إنشاء الحسابات
// =====================================================
// GET /api/v1/account-requests?status=pending
router.get(
  '/',
  authMiddleware,
  organizationMiddleware,
  permissionMiddleware('ACCOUNT_REQUEST_VIEW'),
  AccountRequestController.getRequests // الدالة المقابلة في الـ Controller
);
// 2. الموافقة على طلب إنشاء الحساب
router.post(
  '/:id/approve',
  authMiddleware,
  organizationMiddleware,
  permissionMiddleware('ACCOUNT_REQUEST_MANAGE'),
  approveAccountRequestValidation,
  AccountRequestController.approve
);

// 3. رفض طلب إنشاء الحساب
router.post(
  '/:id/reject',
  authMiddleware,
  organizationMiddleware,
  permissionMiddleware('ACCOUNT_REQUEST_MANAGE'),
  AccountRequestController.reject
);

module.exports = router;