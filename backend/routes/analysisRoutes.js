const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysisController');
const authMiddleware = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

// All analysis routes require authentication (JWT)
router.use(authMiddleware);

router.post(
  '/scan',
  validate(analysisController.scanTextSchema),
  analysisController.scanText
);

router.get(
  '/metrics',
  analysisController.getMetrics
);

router.get(
  '/history',
  analysisController.getHistory
);

module.exports = router;

