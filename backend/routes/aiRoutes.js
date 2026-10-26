const express = require('express');
const router = express.Router();
const aiProxyController = require('../controllers/aiProxyController');
const { verifyToken, authorizeRoles } = require('../middlewares/auth');

router.post(
  '/forecast/cash-flow',
  verifyToken,
  authorizeRoles('BUSINESS_OWNER'),
  aiProxyController.getCashFlowForecast
);

router.post(
  '/recommend/cross-sell',
  verifyToken,
  authorizeRoles('CASHIER', 'BUSINESS_OWNER', 'ADMIN', 'Admin', 'Cashier'),
  aiProxyController.getCrossSellRecommendations
);

router.get(
  '/risk/stream',
  verifyToken,
  authorizeRoles('BUSINESS_OWNER'),
  aiProxyController.getRiskAuditStream
);

router.post(
  '/risk/score/:customer_id',
  verifyToken,
  authorizeRoles('BUSINESS_OWNER'),
  aiProxyController.scoreCreditRisk
);

router.post(
  '/risk/override',
  verifyToken,
  authorizeRoles('BUSINESS_OWNER'),
  aiProxyController.overrideCustomerRisk
);

router.post(
  '/retrain',
  verifyToken,
  authorizeRoles('BUSINESS_OWNER', 'ADMIN', 'Business Owner', 'Admin'),
  aiProxyController.triggerRetrain
);

router.get(
  '/inventory/velocity',
  verifyToken,
  aiProxyController.getInventoryVelocity
);

router.get(
  '/models/metrics',
  verifyToken,
  aiProxyController.getModelMetrics
);

// Advanced AI Command Center & Discount Technology Routes
router.get(
  '/command-center/overview',
  verifyToken,
  aiProxyController.getCommandCenterOverview
);

router.get(
  '/discounts/analysis',
  verifyToken,
  aiProxyController.getDiscountAnalysis
);

router.post(
  '/discounts/simulate',
  verifyToken,
  aiProxyController.simulateDiscount
);

router.post(
  '/assistant/query',
  verifyToken,
  aiProxyController.askAiAssistant
);

module.exports = router;
