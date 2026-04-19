// backend/src/routes/subjectRoutes.js
const express = require('express');
const { getSubjects, getSubjectById, createSubject, updateSubject, deleteSubject } = require('../controllers/subjectController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', verifyToken, getSubjects); // Accessible by all logged-in users
router.get('/:id', verifyToken, getSubjectById);
router.post('/', verifyToken, authorizeRole(['admin', 'faculty']), createSubject);
router.put('/:id', verifyToken, authorizeRole(['admin', 'faculty']), updateSubject);
router.delete('/:id', verifyToken, authorizeRole(['admin']), deleteSubject);

module.exports = router;