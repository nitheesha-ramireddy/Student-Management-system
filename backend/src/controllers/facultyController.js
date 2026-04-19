// backend/src/controllers/facultyController.js
const { getDB, saveDB } = require('../db/db');
const { v4: uuidv4 } = require('uuid');

const getFaculty = (req, res) => {
    const db = getDB();
    res.json(db.faculty);
};

const getFacultyById = (req, res) => {
    const { id } = req.params;
    const db = getDB();
    const faculty = db.faculty.find(f => f.id === id);
    if (!faculty) {
        return res.status(404).json({ message: 'Faculty not found.' });
    }
    res.json(faculty);
};

const createFaculty = (req, res) => {
    const { name, email, subjectId, studentIds } = req.body;
    if (!name || !email || !subjectId) {
        return res.status(400).json({ message: 'Name, email, and subject ID are required.' });
    }
    const db = getDB();
    const newFacultyId = `fac-${uuidv4()}`;
    const subject = db.subjects.find(s => s.id === subjectId);
    if (!subject) {
        return res.status(400).json({ message: 'Subject not found.' });
    }
    const newFaculty = {
        id: newFacultyId,
        name, email,
        subjectId,
        subjectName: subject.name,
        studentIds: studentIds || []
    };
    db.faculty.push(newFaculty);
    // Also add to users table for login
    db.users.push({ id: newFaculty.id, name: newFaculty.name, password: 'password123', role: 'faculty', email: newFaculty.email });

    // Update subject to link new faculty
    db.subjects = db.subjects.map(s => s.id === subjectId ? { ...s, facultyId: newFacultyId } : s);

    saveDB();
    res.status(201).json(newFaculty);
};

const updateFaculty = (req, res) => {
    const { id } = req.params;
    const { name, email, subjectId, studentIds } = req.body;
    const db = getDB();
    const facultyIndex = db.faculty.findIndex(f => f.id === id);

    if (facultyIndex === -1) {
        return res.status(404).json({ message: 'Faculty not found.' });
    }

    const currentFaculty = db.faculty[facultyIndex];
    const newSubject = subjectId ? db.subjects.find(s => s.id === subjectId) : null;

    db.faculty[facultyIndex] = {
        ...currentFaculty,
        name: name || currentFaculty.name,
        email: email || currentFaculty.email,
        subjectId: newSubject ? newSubject.id : currentFaculty.subjectId,
        subjectName: newSubject ? newSubject.name : currentFaculty.subjectName,
        studentIds: studentIds || currentFaculty.studentIds
    };

    // Update corresponding user entry too if name/email changed
    const userIndex = db.users.findIndex(u => u.id === id);
    if (userIndex !== -1) {
        db.users[userIndex].name = name || db.users[userIndex].name;
        db.users[userIndex].email = email || db.users[userIndex].email;
        if (newSubject) {
             db.users[userIndex].subjectId = newSubject.id;
             db.users[userIndex].subjectName = newSubject.name;
        }
    }
    saveDB();
    res.json(db.faculty[facultyIndex]);
};

const deleteFaculty = (req, res) => {
    const { id } = req.params;
    const db = getDB();
    const initialFacultyCount = db.faculty.length;

    db.faculty = db.faculty.filter(f => f.id !== id);
    db.users = db.users.filter(u => u.id !== id); // Remove user login

    // Clean up related data:
    db.attendance = db.attendance.filter(a => a.facultyId !== id);
    db.assignments = db.assignments.filter(a => a.facultyId !== id);
    db.notices = db.notices.filter(n => n.facultyId !== id);
    db.grades = db.grades.filter(g => g.facultyId !== id);

    // Remove faculty from subjects
    db.subjects = db.subjects.map(s => s.facultyId === id ? { ...s, facultyId: '' } : s);

    if (db.faculty.length === initialFacultyCount) {
        return res.status(404).json({ message: 'Faculty not found.' });
    }
    saveDB();
    res.status(204).send(); // No Content
};

module.exports = {
    getFaculty,
    getFacultyById,
    createFaculty,
    updateFaculty,
    deleteFaculty
};