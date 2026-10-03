const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { verifyToken, authorizeRoles } = require('../middlewares/auth');

router.get('/', verifyToken, inventoryController.getProducts);
router.get('/products', verifyToken, inventoryController.getProducts);
router.post('/restock', verifyToken, inventoryController.restockProduct);

router.post(
  '/products',
  verifyToken,
  authorizeRoles('WAREHOUSE_MGR', 'BUSINESS_OWNER'),
  inventoryController.createProduct
);

router.post(
  '/grn',
  verifyToken,
  authorizeRoles('WAREHOUSE_MGR', 'BUSINESS_OWNER'),
  inventoryController.recordInwardGRN
);

router.get('/low-stock', verifyToken, inventoryController.getLowStockAlerts);
router.get('/expiry-audit', verifyToken, inventoryController.getExpiryAudit);

module.exports = router;
