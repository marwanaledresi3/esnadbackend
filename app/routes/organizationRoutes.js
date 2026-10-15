const express = require('express');
const router = express.Router();
const OrganizationController = require('../controllers/OrganizationController');
const authMiddleware = require('../middlewares/authMiddleware');
const organizationMiddleware = require('../middlewares/organizationMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');



// استرجاع قائمة جميع المنشآت للمستخدم الموثق
router.get('/', 
  
  OrganizationController.getAll
);

router.get(
  '/search',
  
  OrganizationController.getOrganizations
);
router.use(authMiddleware);
// إضافة منشأة جديدة (تتطلب سياق وصلاحيات إدارية)
router.post(
  '/',
  organizationMiddleware,
  permissionMiddleware('ORGANIZATION_MANAGE'),
  OrganizationController.create
);

router.put(
  '/:organizationId/status',
  organizationMiddleware,
  permissionMiddleware('ORGANIZATION_MANAGE'),
  OrganizationController.updateOrganizationStatus
);



router.delete(
  '/:organizationId',
  organizationMiddleware,
  permissionMiddleware('ORGANIZATION_MANAGE'),
  OrganizationController.deleteOrganization
);

module.exports = router;