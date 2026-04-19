// backend/src/routes/gradeRoutes.js
const express = require('express');
const { getGrades, getGradeById, createGrade, updateGrade, deleteGrade } = require('../controllers/gradeController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', verifyToken, getGrades); // Filtered by role in controller
router.get('/:id', verifyToken, getGradeById);
router.post('/', verifyToken, authorizeRole(['faculty']), createGrade);
router.put('/:id', verifyToken, authorizeRole(['faculty']), updateGrade);
router.delete('/:id', verifyToken, authorizeRole(['faculty']), deleteGrade);

module.exports = router;