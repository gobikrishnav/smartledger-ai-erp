const express = require('express');
const router = express.Router();
const insightController = require('../controllers/insightController');
const { verifyToken } = require('../middlewares/auth');

router.use(verifyToken);

router.get('/', insightController.getInsights);
router.get('/summary', insightController.getInsightsSummary);
router.patch('/:id/status', insightController.updateInsightStatus);
router.post('/refresh', insightController.refreshInsights);

module.exports = router;
