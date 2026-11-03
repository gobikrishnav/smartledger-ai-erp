const express = require('express');
const router = express.Router();
const aiProxyController = require('../controllers/aiProxyController');
const { verifyToken, authorizeRoles } = require('../middlewares/auth');

// 1. Cash Flow Forecaster (Bi-LSTM / Holt-Winters)
router.post(
  '/forecast/cash-flow',
  verifyToken,
  authorizeRoles('BUSINESS_OWNER', 'ADMIN', 'Admin', 'Business Owner'),
  aiProxyController.getCashFlowForecast
);
router.get(
  '/forecast/cash-flow',
  verifyToken,
  authorizeRoles('BUSINESS_OWNER', 'ADMIN', 'Admin', 'Business Owner'),
  aiProxyController.getCashFlowForecast
);

// 2. Apriori Market Basket Cross-Sell Recommender
router.post(
  '/recommend/cross-sell',
  verifyToken,
  authorizeRoles('CASHIER', 'BUSINESS_OWNER', 'ADMIN', 'Admin', 'Cashier', 'Business Owner'),
  aiProxyController.getCrossSellRecommendations
);
router.get(
  '/recommend/cross-sell',
  verifyToken,
  authorizeRoles('CASHIER', 'BUSINESS_OWNER', 'ADMIN', 'Admin', 'Cashier', 'Business Owner'),
  aiProxyController.getCrossSellRecommendations
);

// 3. Isolation Forest Credit Risk Stream & Scoring
router.get(
  '/risk/stream',
  verifyToken,
  authorizeRoles('BUSINESS_OWNER', 'ADMIN', 'Admin', 'Business Owner'),
  aiProxyController.getRiskAuditStream
);

router.post(
  '/risk/score/:customer_id',
  verifyToken,
  authorizeRoles('BUSINESS_OWNER', 'ADMIN', 'Admin', 'Business Owner'),
  aiProxyController.scoreCreditRisk
);
router.get(
  '/risk/score/:customer_id',
  verifyToken,
  authorizeRoles('BUSINESS_OWNER', 'ADMIN', 'Admin', 'Business Owner'),
  aiProxyController.scoreCreditRisk
);

router.post(
  '/risk/override',
  verifyToken,
  authorizeRoles('BUSINESS_OWNER', 'ADMIN', 'Admin', 'Business Owner'),
  aiProxyController.overrideCustomerRisk
);

// 4. ML Models Retraining Orchestrator
router.post(
  '/retrain',
  verifyToken,
  authorizeRoles('BUSINESS_OWNER', 'ADMIN', 'Business Owner', 'Admin'),
  aiProxyController.triggerRetrain
);
router.get(
  '/retrain',
  verifyToken,
  authorizeRoles('BUSINESS_OWNER', 'ADMIN', 'Business Owner', 'Admin'),
  aiProxyController.triggerRetrain
);

// 5. Inventory Velocity & Stock Telemetry
router.get(
  '/inventory/velocity',
  verifyToken,
  aiProxyController.getInventoryVelocity
);
router.post(
  '/inventory/velocity',
  verifyToken,
  aiProxyController.getInventoryVelocity
);

router.get(
  '/models/metrics',
  verifyToken,
  aiProxyController.getModelMetrics
);

// 6. Advanced AI Command Center & Discount Technology Routes
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

// 7. Conversational AI Assistant & Gemini Copilot
router.post(
  '/assistant/query',
  verifyToken,
  aiProxyController.askAiAssistant
);
router.post(
  '/copilot/chat',
  verifyToken,
  aiProxyController.askAiAssistant
);

module.exports = router;
