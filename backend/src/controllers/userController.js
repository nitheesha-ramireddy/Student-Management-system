// backend/src/controllers/userController.js
const { getDB } = require('../db/db');

const getUserProfile = (req, res) => {
    const userId = req.user.id; // ID from verified JWT token
    const db = getDB();
    const user = db.users.find(u => u.id === userId);

    if (!user) {
        return res.status(404).json({ message: 'User not found.' });
    }

    // Filter data based on role for the frontend
    const userProfile = { id: user.id, name: user.name, email: user.email, role: user.role };

    if (user.role === 'faculty') {
        const facultyData = db.faculty.find(f => f.id === userId);
        if (facultyData) {
            Object.assign(userProfile, {
                subjectId: facultyData.subjectId,
                subjectName: facultyData.subjectName,
                studentIds: facultyData.studentIds
            });
        }
    } else if (user.role === 'student') {
        const studentData = db.students.find(s => s.id === userId);
        if (studentData) {
            Object.assign(userProfile, {
                subjectIds: studentData.subjectIds,
                attendance: studentData.attendance,
                grades: studentData.grades
            });
        }
    }
    res.json(userProfile);
};

module.exports = {
    getUserProfile
};