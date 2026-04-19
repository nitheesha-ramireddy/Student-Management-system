// backend/src/routes/facultyRoutes.js
const express = require('express');
const { getFaculty, getFacultyById, createFaculty, updateFaculty, deleteFaculty } = require('../controllers/facultyController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', verifyToken, getFaculty); // Accessible by all logged-in users
router.get('/:id', verifyToken, getFacultyById);
router.post('/', verifyToken, authorizeRole(['admin']), createFaculty); // Assuming only admin can create faculty
router.put('/:id', verifyToken, authorizeRole(['admin', 'faculty']), updateFaculty); // Faculty can update own profile
router.delete('/:id', verifyToken, authorizeRole(['admin']), deleteFaculty);

module.exports = router;