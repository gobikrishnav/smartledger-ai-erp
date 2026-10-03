const express = require('express');
const router = express.Router();
const businessController = require('../controllers/businessController');
const { verifyToken, requireRole } = require('../middlewares/auth');

router.use(verifyToken);

router.get('/', businessController.getBusinessProfile);
router.put('/', requireRole('BUSINESS_OWNER', 'ADMIN', 'Business Owner', 'Admin'), businessController.updateBusinessProfile);
router.post('/setup-wizard', requireRole('BUSINESS_OWNER', 'ADMIN', 'Business Owner', 'Admin'), businessController.setupWizard);

module.exports = router;
