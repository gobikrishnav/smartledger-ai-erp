const express = require('express');
const router = express.Router();
const taxController = require('../controllers/taxController');
const { verifyToken, authorizeRoles } = require('../middlewares/auth');

router.use(verifyToken);

// Executive Tax & GST Overview
router.get('/summary', taxController.getTaxSummary);

// GSTR-1 Statutory Return Data (Tables 4A, 7, 12)
router.get('/gstr1', taxController.getGSTR1);

// HSN/SAC Directory & Matrix
router.get('/hsn-directory', taxController.getHsnDirectory);

// Tax Simulation Modeler
router.post('/simulate', taxController.simulateTax);

// Export GSTR-1 as CSV or JSON for Government GST Portal
router.get('/export', taxController.exportTaxReport);

// Admin Tax Recalculation & Harmonization across all database records
router.post('/recalculate', authorizeRoles('ADMIN', 'BUSINESS_OWNER'), taxController.recalculateAllInvoicesTax);

module.exports = router;
