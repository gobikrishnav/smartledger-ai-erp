const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { verifyToken, requireRole } = require('../middlewares/auth');

router.use(verifyToken);

// Accessible by Business Owner and Admin
router.get('/', requireRole('BUSINESS_OWNER', 'ADMIN', 'Business Owner', 'Admin'), auditController.getAuditLogs);
router.get('/stats', requireRole('BUSINESS_OWNER', 'ADMIN', 'Business Owner', 'Admin'), auditController.getAuditStats);
router.post('/', auditController.createAuditLog);

module.exports = router;
