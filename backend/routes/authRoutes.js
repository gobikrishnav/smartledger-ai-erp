const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middlewares/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google', authController.googleAuth);
router.get('/google/config', authController.getGoogleConfig);
router.post('/google/config', authController.saveGoogleConfig);
router.get('/profile', verifyToken, authController.getProfile);

module.exports = router;
