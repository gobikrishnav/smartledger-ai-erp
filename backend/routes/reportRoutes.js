const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken, requireRole } = require('../middlewares/auth');

router.use(verifyToken);

// Sales report
router.get('/sales', requireRole('BUSINESS_OWNER', 'ADMIN', 'Business Owner', 'Admin'), reportController.getSalesReport);

// GST statutory GSTR-1 report
router.get('/gst', requireRole('BUSINESS_OWNER', 'ADMIN', 'Business Owner', 'Admin'), reportController.getGSTReport);

// Inventory valuation report
router.get('/inventory', requireRole('BUSINESS_OWNER', 'ADMIN', 'WAREHOUSE_MGR', 'Business Owner', 'Admin', 'Warehouse Manager'), reportController.getInventoryReport);

// Customers receivables aging report
router.get('/customers', requireRole('BUSINESS_OWNER', 'ADMIN', 'Business Owner', 'Admin'), reportController.getCustomersReport);

module.exports = router;
