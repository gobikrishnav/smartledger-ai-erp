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
  authorizeRoles('CASHIER', 'BUSINESS_OWNER'),
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

module.exports = router;
