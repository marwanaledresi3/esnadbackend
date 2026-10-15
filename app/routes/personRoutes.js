const express = require('express');
const router = express.Router();
const PersonController = require('../controllers/PersonController');
const authMiddleware = require('../middlewares/authMiddleware');
const organizationMiddleware = require('../middlewares/organizationMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

router.use(authMiddleware);
router.use(organizationMiddleware);

// قائمة الأشخاص
router.get('/',
  permissionMiddleware('CASE_VIEW'),
   PersonController.getAll
  );

// إحصائيات
router.get('/count',
  permissionMiddleware('CASE_VIEW'),
   PersonController.count
  );

// شخص واحد
router.get('/:id', 
  permissionMiddleware('CASE_VIEW'),
  PersonController.getById
);

// إنشاء
router.post('/',
  permissionMiddleware('CASE_VIEW'),
   PersonController.create
  );

// تحديث
router.put('/:id', 
  permissionMiddleware('CASE_VIEW'),
  PersonController.update
);

// حذف
router.delete('/:id', 
  permissionMiddleware('CASE_VIEW'),
  PersonController.delete
);

module.exports = router;