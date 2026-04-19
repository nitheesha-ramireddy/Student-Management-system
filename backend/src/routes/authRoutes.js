// backend/src/routes/authRoutes.js
const express = require('express');
const { login, register, changePassword } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.put('/change-password', verifyToken, changePassword);

module.exports = router;