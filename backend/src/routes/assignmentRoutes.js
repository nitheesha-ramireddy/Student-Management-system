// backend/src/routes/assignmentRoutes.js
const express = require('express');
const { getAssignments, getAssignmentById, createAssignment, updateAssignment, deleteAssignment, submitAssignment } = require('../controllers/assignmentController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', verifyToken, getAssignments); // Filtered by role in controller
router.get('/:id', verifyToken, getAssignmentById);
router.post('/', verifyToken, authorizeRole(['faculty']), createAssignment);
router.put('/:id', verifyToken, authorizeRole(['faculty']), updateAssignment);
router.delete('/:id', verifyToken, authorizeRole(['faculty']), deleteAssignment);
router.post('/:id/submit', verifyToken, authorizeRole(['student']), submitAssignment); // Student submission

module.exports = router;