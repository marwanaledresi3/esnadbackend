const express = require('express');
const router = express.Router();

const DepartmentController = require('../controllers/DepartmentController');
const authMiddleware = require('../middlewares/authMiddleware');
const organizationMiddleware = require('../middlewares/organizationMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

router.use(authMiddleware);
router.use(organizationMiddleware);

// إضافة قسم جديد للجهة الحالية
router.post(
  '/',
  permissionMiddleware('USER_APPROVE'),
  DepartmentController.createDepartment
);

// استرجاع أقسام جهة معينة
router.get(
  '/organization/:organizationId',
  DepartmentController.getDepartmentsByOrganization
);

module.exports = router;