const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { verifyToken, authorizeRoles } = require('../middlewares/auth');
const { verifyTerminalGeoToken } = require('../middlewares/geoFence');

router.post(
  '/',
  verifyToken,
  authorizeRoles('CASHIER', 'BUSINESS_OWNER'),
  verifyTerminalGeoToken,
  invoiceController.createInvoice
);

router.get('/profit-summary', verifyToken, invoiceController.getProfitSummary);
router.get('/', verifyToken, invoiceController.getInvoices);
router.get('/:id', verifyToken, invoiceController.getInvoiceById);
router.put('/:id/finalize', verifyToken, invoiceController.finalizeInvoice);
router.put('/:id/cancel', verifyToken, invoiceController.cancelInvoice);

module.exports = router;
