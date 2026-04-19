// backend/src/routes/userRoutes.js
const express = require('express');
const { getUserProfile } = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/profile', verifyToken, getUserProfile);

module.exports = router;