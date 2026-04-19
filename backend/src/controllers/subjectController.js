// backend/src/controllers/subjectController.js
const { getDB, saveDB } = require('../db/db');
const { v4: uuidv4 } = require('uuid');

const getSubjects = (req, res) => {
    const db = getDB();
    res.json(db.subjects);
};

const getSubjectById = (req, res) => {
    const { id } = req.params;
    const db = getDB();
    const subject = db.subjects.find(s => s.id === id);
    if (!subject) {
        return res.status(404).json({ message: 'Subject not found.' });
    }
    res.json(subject);
};

const createSubject = (req, res) => {
    const { name, code, facultyId, studentIds } = req.body;
    if (!name || !code) {
        return res.status(400).json({ message: 'Name and code are required.' });
    }
    const db = getDB();
    const newSubject = {
        id: `subj-${uuidv4()}`,
        name, code,
        facultyId: facultyId || '', // Can be assigned later
        studentIds: studentIds || [] // Can be assigned later
    };
    db.subjects.push(newSubject);
    saveDB();
    res.status(201).json(newSubject);
};

const updateSubject = (req, res) => {
    const { id } = req.params;
    const { name, code, facultyId, studentIds } = req.body;
    const db = getDB();
    const subjectIndex = db.subjects.findIndex(s => s.id === id);

    if (subjectIndex === -1) {
        return res.status(404).json({ message: 'Subject not found.' });
    }

    db.subjects[subjectIndex] = { ...db.subjects[subjectIndex], name: name || db.subjects[subjectIndex].name, code: code || db.subjects[subjectIndex].code, facultyId: facultyId || db.subjects[subjectIndex].facultyId, studentIds: studentIds || db.subjects[subjectIndex].studentIds };
    saveDB();
    res.json(db.subjects[subjectIndex]);
};

const deleteSubject = (req, res) => {
    const { id } = req.params;
    const db = getDB();
    const initialSubjectCount = db.subjects.length;

    db.subjects = db.subjects.filter(s => s.id !== id);
    // Clean up related data:
    db.attendance = db.attendance.filter(a => a.subjectId !== id);
    db.assignments = db.assignments.filter(a => a.subjectId !== id);
    db.notices = db.notices.filter(n => n.subjectId !== id);
    db.grades = db.grades.filter(g => g.subjectId !== id);

    // Remove subject from student and faculty lists if assigned
    db.students = db.students.map(s => ({ ...s, subjectIds: s.subjectIds.filter(sId => sId !== id) }));
    db.faculty = db.faculty.map(f => f.subjectId === id ? { ...f, subjectId: '', subjectName: 'Unassigned' } : f);

    if (db.subjects.length === initialSubjectCount) {
        return res.status(404).json({ message: 'Subject not found.' });
    }
    saveDB();
    res.status(204).send(); // No Content
};

module.exports = {
    getSubjects,
    getSubjectById,
    createSubject,
    updateSubject,
    deleteSubject
};