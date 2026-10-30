const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const validate = require('../middleware/validate');
const authMiddleware = require('../middleware/authMiddleware');

// Public endpoints
router.post(
  '/register',
  validate(authController.registerSchema),
  authController.register
);

router.post(
  '/login',
  validate(authController.loginSchema),
  authController.login
);

// Private endpoint
router.get(
  '/me',
  authMiddleware,
  authController.getMe
);

module.exports = router;
