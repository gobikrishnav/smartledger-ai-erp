const express = require('express');
const router = express.Router();
const poController = require('../controllers/poController');
const { verifyToken, authorizeRoles } = require('../middlewares/auth');

router.get('/', verifyToken, authorizeRoles('WAREHOUSE_MGR', 'BUSINESS_OWNER'), poController.getPurchaseOrders);

router.post(
  '/auto-dispatch',
  verifyToken,
  authorizeRoles('WAREHOUSE_MGR', 'BUSINESS_OWNER'),
  poController.createAutomatedPO
);

router.put(
  '/:id/status',
  verifyToken,
  authorizeRoles('WAREHOUSE_MGR', 'BUSINESS_OWNER'),
  poController.updatePOStatus
);

module.exports = router;
