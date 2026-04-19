// backend/src/routes/attendanceRoutes.js
const express = require('express');
const { getAttendance, getAttendanceById, createAttendance, updateAttendance, deleteAttendance } = require('../controllers/attendanceController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', verifyToken, authorizeRole(['faculty', 'student']), getAttendance); // Filtered by role in controller
router.get('/:id', verifyToken, authorizeRole(['faculty', 'student']), getAttendanceById);
router.post('/', verifyToken, authorizeRole(['faculty']), createAttendance);
router.put('/:id', verifyToken, authorizeRole(['faculty']), updateAttendance);
router.delete('/:id', verifyToken, authorizeRole(['faculty']), deleteAttendance);

module.exports = router;