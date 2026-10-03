const express = require('express');
const router = express.Router();
const ledgerController = require('../controllers/ledgerController');
const { verifyToken, authorizeRoles } = require('../middlewares/auth');

router.use(verifyToken);

router.get('/', ledgerController.getLedgerEntries);
router.get('/summary', ledgerController.getLedgerSummary);
router.get('/trail/:reference_id', ledgerController.getAuditTrail);
router.post('/entry', authorizeRoles('BUSINESS_OWNER', 'ADMIN', 'Business Owner', 'Admin'), ledgerController.createManualEntry);

module.exports = router;
