// backend/src/controllers/studentController.js
const { getDB, saveDB } = require('../db/db');
const { v4: uuidv4 } = require('uuid');

const getStudents = (req, res) => {
    const db = getDB();
    // Faculty can only see students assigned to them
    if (req.user.role === 'faculty') {
        const facultyProfile = db.faculty.find(f => f.id === req.user.id);
        if (!facultyProfile) return res.status(404).json({ message: 'Faculty profile not found.' });
        const assignedStudentIds = facultyProfile.studentIds || [];
        const filteredStudents = db.students.filter(s => assignedStudentIds.includes(s.id));
        return res.json(filteredStudents);
    }
    // Admin (or other roles) might see all
    res.json(db.students);
};

const getStudentById = (req, res) => {
    const { id } = req.params;
    const db = getDB();
    const student = db.students.find(s => s.id === id);
    if (!student) {
        return res.status(404).json({ message: 'Student not found.' });
    }
    // Basic authorization: student can see own profile, faculty can see assigned students. Admin can see all.
    if (req.user.role === 'student' && req.user.id !== id) {
        return res.status(403).json({ message: 'Access denied.' });
    }
    if (req.user.role === 'faculty') {
        const facultyProfile = db.faculty.find(f => f.id === req.user.id);
        if (!facultyProfile || !facultyProfile.studentIds.includes(id)) {
            return res.status(403).json({ message: 'Access denied. Student not assigned to this faculty.' });
        }
    }
    res.json(student);
};

const createStudent = (req, res) => {
    const { name, email, subjectIds } = req.body;
    if (!name || !email) {
        return res.status(400).json({ message: 'Name and email are required.' });
    }
    const db = getDB();
    const newStudent = { id: `stud-${uuidv4()}`, name, email, subjectIds: subjectIds || [], attendance: [], grades: [] };
    db.students.push(newStudent);
    // Also add to users table for login
    db.users.push({ id: newStudent.id, name: newStudent.name, password: 'password123', role: 'student', email: newStudent.email });

    // Link new student to all existing faculty and subjects
    db.faculty = db.faculty.map(f => ({ ...f, studentIds: [...new Set([...f.studentIds, newStudent.id])] }));
    db.subjects = db.subjects.map(s => ({ ...s, studentIds: [...new Set([...s.studentIds, newStudent.id])] }));

    saveDB();
    res.status(201).json(newStudent);
};

const updateStudent = (req, res) => {
    const { id } = req.params;
    const { name, email, subjectIds } = req.body;
    const db = getDB();
    const studentIndex = db.students.findIndex(s => s.id === id);

    if (studentIndex === -1) {
        return res.status(404).json({ message: 'Student not found.' });
    }

    db.students[studentIndex] = { ...db.students[studentIndex], name, email, subjectIds: subjectIds || db.students[studentIndex].subjectIds };
    // Update corresponding user entry too if name/email changed
    const userIndex = db.users.findIndex(u => u.id === id);
    if (userIndex !== -1) {
        db.users[userIndex].name = name;
        db.users[userIndex].email = email;
    }
    saveDB();
    res.json(db.students[studentIndex]);
};

const deleteStudent = (req, res) => {
    const { id } = req.params;
    const db = getDB();
    const initialStudentCount = db.students.length;

    db.students = db.students.filter(s => s.id !== id);
    db.users = db.users.filter(u => u.id !== id); // Remove user login
    db.attendance = db.attendance.filter(a => a.studentId !== id); // Remove related data
    db.assignments = db.assignments.map(a => ({ ...a, submissions: a.submissions.filter(sub => sub.studentId !== id) }));
    db.notices = db.notices.filter(n => n.facultyId !== id); // If faculty also has notices
    db.grades = db.grades.filter(g => g.studentId !== id);

    // Remove student from faculty lists
    db.faculty = db.faculty.map(f => ({ ...f, studentIds: f.studentIds.filter(sId => sId !== id) }));
    // Remove student from subject lists
    db.subjects = db.subjects.map(s => ({ ...s, studentIds: s.studentIds.filter(sId => sId !== id) }));


    if (db.students.length === initialStudentCount) {
        return res.status(404).json({ message: 'Student not found.' });
    }
    saveDB();
    res.status(204).send(); // No Content
};

module.exports = {
    getStudents,
    getStudentById,
    createStudent,
    updateStudent,
    deleteStudent
};