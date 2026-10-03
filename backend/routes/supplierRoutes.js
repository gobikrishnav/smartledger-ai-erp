const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const { verifyToken, authorizeRoles } = require('../middlewares/auth');

router.use(verifyToken);

router.get('/', supplierController.getSuppliers);
router.post('/', authorizeRoles('BUSINESS_OWNER', 'WAREHOUSE_MGR', 'ADMIN'), supplierController.createSupplier);
router.put('/:id', authorizeRoles('BUSINESS_OWNER', 'WAREHOUSE_MGR', 'ADMIN'), supplierController.updateSupplier);
router.delete('/:id', authorizeRoles('ADMIN', 'BUSINESS_OWNER'), supplierController.deleteSupplier);

module.exports = router;
