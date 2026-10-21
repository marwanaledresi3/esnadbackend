// routes/recipientRoutes.js
const express = require('express');
const router = express.Router();

const RecipientController = require('../controllers/RecipientController');
const authMiddleware = require('../middlewares/authMiddleware');
const organizationMiddleware = require('../middlewares/organizationMiddleware');
const permissionMiddleware = require('../middlewares/permissionMiddleware');

// كل المسارات تحتاج تسجيل دخول
router.use(authMiddleware);

// ══════════════════════════════════════════════
// قائمة + بحث + إحصائيات (قبل /:id)
// ══════════════════════════════════════════════

router.get(
  '/',
  organizationMiddleware,
  permissionMiddleware('AUTHORIZATION_VIEW'),
  RecipientController.getAll,
);

router.get(
  '/search',
  organizationMiddleware,
  permissionMiddleware('AUTHORIZATION_VIEW'),
  RecipientController.search,
);

router.get(
  '/count',
  organizationMiddleware,
  RecipientController.count,
);

// ══════════════════════════════════════════════
// مستلم واحد
// ══════════════════════════════════════════════

router.get(
  '/:id',
  organizationMiddleware,
  permissionMiddleware('AUTHORIZATION_VIEW'),
  RecipientController.getById,
);

router.get(
  '/:id/authorizations',
  organizationMiddleware,
  permissionMiddleware('AUTHORIZATION_VIEW'),
  RecipientController.getAuthorizations,
);

// ══════════════════════════════════════════════
// CRUD
// ══════════════════════════════════════════════

router.post(
  '/',
  organizationMiddleware,
  permissionMiddleware('AUTHORIZATION_ISSUE'),
  RecipientController.create,
);

router.put(
  '/:id',
  organizationMiddleware,
  permissionMiddleware('AUTHORIZATION_ISSUE'),
  RecipientController.update,
);

router.delete(
  '/:id',
  organizationMiddleware,
  permissionMiddleware('AUTHORIZATION_ISSUE'),
  RecipientController.delete,
);

module.exports = router;