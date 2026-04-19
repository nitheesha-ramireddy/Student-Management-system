// backend/src/routes/noticeRoutes.js
const express = require('express');
const { getNotices, getNoticeById, createNotice, updateNotice, deleteNotice } = require('../controllers/noticeController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', verifyToken, getNotices); // Filtered by role in controller
router.get('/:id', verifyToken, getNoticeById);
router.post('/', verifyToken, authorizeRole(['faculty']), createNotice);
router.put('/:id', verifyToken, authorizeRole(['faculty']), updateNotice);
router.delete('/:id', verifyToken, authorizeRole(['faculty']), deleteNotice);

module.exports = router;