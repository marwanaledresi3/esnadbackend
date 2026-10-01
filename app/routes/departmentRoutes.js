const express = require('express');
const router = express.Router();
const DepartmentController = require('../controllers/DepartmentController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.use(authMiddleware);

// إضافة قسم جديد (للآدمن فقط)
router.post(
  '/', 
  roleMiddleware(['ADMIN']), 
  DepartmentController.createDepartment
);

// استرجاع أقسام منشأة معينة
router.get('/organization/:organizationId', DepartmentController.getDepartmentsByOrganization);

module.exports = router;