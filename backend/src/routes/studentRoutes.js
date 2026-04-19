// backend/src/routes/studentRoutes.js
const express = require('express');
const { getStudents, getStudentById, createStudent, updateStudent, deleteStudent } = require('../controllers/studentController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');
const router = express.Router();

// Get all students (accessible by faculty, admin)
router.get('/', verifyToken, authorizeRole(['faculty']), getStudents); // Faculty only sees their students, others see all

// Get student by ID (accessible by student themselves, faculty, admin)
router.get('/:id', verifyToken, getStudentById);

// Create student (accessible by admin/faculty)
router.post('/', verifyToken, authorizeRole(['faculty']), createStudent);

// Update student (accessible by admin/faculty)
router.put('/:id', verifyToken, authorizeRole(['faculty']), updateStudent);

// Delete student (accessible by admin/faculty)
router.delete('/:id', verifyToken, authorizeRole(['faculty']), deleteStudent);

module.exports = router;