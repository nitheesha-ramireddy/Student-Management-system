// backend/src/controllers/gradeController.js
const { getDB, saveDB } = require('../db/db');
const { v4: uuidv4 } = require('uuid');

const getGrades = (req, res) => {
    const db = getDB();
    // Faculty sees their assigned students' grades, students see their own
    if (req.user.role === 'faculty') {
        const facultyProfile = db.faculty.find(f => f.id === req.user.id);
        if (!facultyProfile) return res.status(404).json({ message: 'Faculty profile not found.' });
        const filteredGrades = db.grades.filter(g => facultyProfile.studentIds.includes(g.studentId) && g.facultyId === req.user.id);
        return res.json(filteredGrades);
    }
    if (req.user.role === 'student') {
        const filteredGrades = db.grades.filter(g => g.studentId === req.user.id);
        return res.json(filteredGrades);
    }
    res.json(db.grades); // Admin can see all
};

const getGradeById = (req, res) => {
    const { id } = req.params;
    const db = getDB();
    const grade = db.grades.find(g => g.id === id);
    if (!grade) {
        return res.status(404).json({ message: 'Grade not found.' });
    }
    // Basic authorization
    if (req.user.role === 'student' && grade.studentId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied.' });
    }
    if (req.user.role === 'faculty' && grade.facultyId !== req.user.id) {
         const facultyProfile = db.faculty.find(f => f.id === req.user.id);
         if (!facultyProfile || !facultyProfile.studentIds.includes(grade.studentId) || facultyProfile.subjectId !== grade.subjectId) {
             return res.status(403).json({ message: 'Access denied. You are not authorized for this grade record.' });
         }
    }
    res.json(grade);
};

const createGrade = (req, res) => {
    const { studentId, subjectId, semester, grade, points } = req.body;
    if (!studentId || !subjectId || !semester || !grade || points === undefined) {
        return res.status(400).json({ message: 'Missing required fields.' });
    }
    if (req.user.role !== 'faculty') {
        return res.status(403).json({ message: 'Only faculty can assign grades.' });
    }
    const db = getDB();
    // Ensure faculty is authorized to assign for this student/subject
    const facultyProfile = db.faculty.find(f => f.id === req.user.id);
    if (!facultyProfile || !facultyProfile.studentIds.includes(studentId) || facultyProfile.subjectId !== subjectId) {
        return res.status(403).json({ message: 'Unauthorized to assign grade for this student/subject.' });
    }

    const newGrade = {
        id: `grade-${uuidv4()}`,
        studentId, subjectId, facultyId: req.user.id, semester, grade, points,
        createdAt: new Date().toISOString()
    };
    db.grades.push(newGrade);
    saveDB();
    res.status(201).json(newGrade);
};

const updateGrade = (req, res) => {
    const { id } = req.params;
    const { studentId, subjectId, semester, grade, points } = req.body;
    const db = getDB();
    const gradeIndex = db.grades.findIndex(g => g.id === id);

    if (gradeIndex === -1) {
        return res.status(404).json({ message: 'Grade not found.' });
    }
    if (req.user.role !== 'faculty' || db.grades[gradeIndex].facultyId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied. Only the assigned faculty can update this grade.' });
    }

    const currentGrade = db.grades[gradeIndex];
    db.grades[gradeIndex] = {
        ...currentGrade,
        studentId: studentId || currentGrade.studentId,
        subjectId: subjectId || currentGrade.subjectId,
        semester: semester || currentGrade.semester,
        grade: grade || currentGrade.grade,
        points: points !== undefined ? points : currentGrade.points,
    };
    saveDB();
    res.json(db.grades[gradeIndex]);
};

const deleteGrade = (req, res) => {
    const { id } = req.params;
    const db = getDB();
    const initialCount = db.grades.length;

    const gradeToDelete = db.grades.find(g => g.id === id);
    if (!gradeToDelete) {
        return res.status(404).json({ message: 'Grade not found.' });
    }
    if (req.user.role !== 'faculty' || gradeToDelete.facultyId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied. Only the assigned faculty can delete this grade.' });
    }

    db.grades = db.grades.filter(g => g.id !== id);
    saveDB();
    if (db.grades.length === initialCount) {
        return res.status(404).json({ message: 'Grade not found.' });
    }
    res.status(204).send();
};

module.exports = {
    getGrades,
    getGradeById,
    createGrade,
    updateGrade,
    deleteGrade
};