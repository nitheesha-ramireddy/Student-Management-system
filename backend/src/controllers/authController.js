// backend/src/controllers/authController.js
const { getDB, saveDB } = require('../db/db');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid'); // For unique IDs
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

const login = (req, res) => {
    const { name, password } = req.body;
    const db = getDB();
    const user = db.users.find(u => u.name === name && u.password === password); // In production, hash passwords

    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '1h' });
    // Remove password before sending to frontend
    const { password: userPassword, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
};

const register = (req, res) => {
    const { name, password, email, role } = req.body;
    const db = getDB();

    if (db.users.some(u => u.name === name)) {
        return res.status(409).json({ message: 'Username already exists.' });
    }

    const newUserId = `user-${uuidv4()}`;
    const newUser = { id: newUserId, name, password, email, role }; // Password saved as plain text for demo

    // Initialize additional data based on role
    if (role === 'faculty') {
        const assignedSubject = db.subjects[Math.floor(Math.random() * db.subjects.length)];
        newUser.subjectId = assignedSubject ? assignedSubject.id : '';
        newUser.subjectName = assignedSubject ? assignedSubject.name : 'Unassigned';
        newUser.studentIds = db.students.map(s => s.id); // Assign all existing students

        db.faculty.push({
            id: newUserId,
            name, email,
            subjectId: newUser.subjectId,
            subjectName: newUser.subjectName,
            studentIds: newUser.studentIds
        });
        // Update subject to link new faculty
        if (assignedSubject) {
            db.subjects = db.subjects.map(s => s.id === assignedSubject.id ? { ...s, facultyId: newUserId } : s);
        }

    } else if (role === 'student') {
        newUser.subjectIds = db.subjects.map(s => s.id); // Enroll in all subjects
        // Student profiles might have more specific fields
        db.students.push({
            id: newUserId,
            name, email,
            subjectIds: newUser.subjectIds,
            attendance: [], // Initialize empty
            grades: []     // Initialize empty
        });

        // Link new student to all existing faculty and subjects
        db.faculty = db.faculty.map(f => {
            if (!f.studentIds.includes(newUserId)) {
                return { ...f, studentIds: [...f.studentIds, newUserId] };
            }
            return f;
        });
        db.subjects = db.subjects.map(s => {
            if (!s.studentIds.includes(newUserId)) {
                return { ...s, studentIds: [...s.studentIds, newUserId] };
            }
            return s;
        });
    }

    db.users.push(newUser);
    saveDB();

    const token = jwt.sign({ id: newUser.id, role: newUser.role, name: newUser.name }, JWT_SECRET, { expiresIn: '1h' });
    const { password: userPassword, ...userWithoutPassword } = newUser;
    res.status(201).json({ message: 'Registration successful!', token, user: userWithoutPassword });
};

const changePassword = (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id; // From authenticated token
    const db = getDB();

    const userIndex = db.users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        return res.status(404).json({ message: 'User not found.' });
    }

    const user = db.users[userIndex];
    if (user.password !== currentPassword) { // In production, compare hashed passwords
        return res.status(401).json({ message: 'Incorrect current password.' });
    }

    if (newPassword.length < 6) { // Simple validation
        return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
    }

    db.users[userIndex].password = newPassword; // Update password
    saveDB();

    // Re-issue token with potentially updated user data (though password isn't in token payload usually)
    const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Password changed successfully!', token });
};


module.exports = {
    login,
    register,
    changePassword
};