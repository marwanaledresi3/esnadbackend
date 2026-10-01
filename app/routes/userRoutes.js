const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// جميع مسارات المستخدمين تتطلب تسجيل الدخول
router.use(authMiddleware);

// إنشاء حساب جديد (خاص بالمدير ADMIN)
router.post('/', roleMiddleware(['ADMIN']), UserController.createUser);

// عرض المستخدمين
router.get('/', roleMiddleware(['ADMIN', 'SUPERVISOR']), UserController.getUsers);

// تغيير حالة التفعيل
router.patch('/:userId/status', roleMiddleware(['ADMIN']), UserController.toggleUserStatus);

module.exports = router;