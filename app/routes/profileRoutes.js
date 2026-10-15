// routes/profileRoutes.js
const express = require('express');
const router = express.Router();

const ProfileController = require('../controllers/ProfileController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/', ProfileController.getProfile);
router.put('/', ProfileController.updateProfile);
router.post('/change-password', ProfileController.changePassword);
router.get('/activity', ProfileController.getActivity);

module.exports = router;