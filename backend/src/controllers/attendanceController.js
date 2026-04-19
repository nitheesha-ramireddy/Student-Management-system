// backend/src/controllers/attendanceController.js
const { getDB, saveDB } = require('../db/db');
const { v4: uuidv4 } = require('uuid');

const getAttendance = (req, res) => {
    const db = getDB();
    // Faculty can only see attendance for their assigned students/subjects
    if (req.user.role === 'faculty') {
        const facultyProfile = db.faculty.find(f => f.id === req.user.id);
        if (!facultyProfile) return res.status(404).json({ message: 'Faculty profile not found.' });
        const filteredAttendance = db.attendance.filter(
            a => a.facultyId === req.user.id || (facultyProfile.studentIds.includes(a.studentId) && a.subjectId === facultyProfile.subjectId)
        );
        return res.json(filteredAttendance);
    }
    // Students can only see their own attendance
    if (req.user.role === 'student') {
        const filteredAttendance = db.attendance.filter(a => a.studentId === req.user.id);
        return res.json(filteredAttendance);
    }
    res.json(db.attendance); // Admin can see all
};

const getAttendanceById = (req, res) => {
    const { id } = req.params;
    const db = getDB();
    const record = db.attendance.find(a => a.id === id);
    if (!record) {
        return res.status(404).json({ message: 'Attendance record not found.' });
    }
    // Basic authorization
    if (req.user.role === 'student' && record.studentId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied.' });
    }
    if (req.user.role === 'faculty' && record.facultyId !== req.user.id) {
         // Also check if faculty is assigned to this student/subject for that record
         const facultyProfile = db.faculty.find(f => f.id === req.user.id);
         if (!facultyProfile || !facultyProfile.studentIds.includes(record.studentId) || facultyProfile.subjectId !== record.subjectId) {
             return res.status(403).json({ message: 'Access denied. You are not authorized for this record.' });
         }
    }
    res.json(record);
};

const createAttendance = (req, res) => {
    const { studentId, subjectId, date, status } = req.body;
    if (!studentId || !subjectId || !date || !status) {
        return res.status(400).json({ message: 'Missing required fields.' });
    }
    if (req.user.role !== 'faculty') {
        return res.status(403).json({ message: 'Only faculty can create attendance records.' });
    }
    const db = getDB();
    // Ensure faculty is authorized to mark for this student/subject
    const facultyProfile = db.faculty.find(f => f.id === req.user.id);
    if (!facultyProfile || !facultyProfile.studentIds.includes(studentId) || facultyProfile.subjectId !== subjectId) {
        return res.status(403).json({ message: 'Unauthorized to mark attendance for this student/subject.' });
    }

    // Prevent duplicate entries for the same student, subject, and date
    const existing = db.attendance.find(a => a.studentId === studentId && a.subjectId === subjectId && a.date === date);
    if (existing) {
        return res.status(409).json({ message: 'Attendance already recorded for this student, subject, and date. Use update instead.' });
    }

    const newRecord = { id: `att-${uuidv4()}`, studentId, subjectId, date, status, facultyId: req.user.id };
    db.attendance.push(newRecord);
    saveDB();
    res.status(201).json(newRecord);
};

const updateAttendance = (req, res) => {
    const { id } = req.params;
    const { studentId, subjectId, date, status } = req.body; // Can update specific fields
    const db = getDB();
    const recordIndex = db.attendance.findIndex(a => a.id === id);

    if (recordIndex === -1) {
        return res.status(404).json({ message: 'Attendance record not found.' });
    }
    if (req.user.role !== 'faculty') { // Only faculty can update attendance
        return res.status(403).json({ message: 'Access denied. Only faculty can update attendance.' });
    }

    const currentRecord = db.attendance[recordIndex];
    // Ensure faculty is authorized to update this specific record
    if (currentRecord.facultyId !== req.user.id) {
         const facultyProfile = db.faculty.find(f => f.id === req.user.id);
         if (!facultyProfile || !facultyProfile.studentIds.includes(currentRecord.studentId) || facultyProfile.subjectId !== currentRecord.subjectId) {
             return res.status(403).json({ message: 'Access denied. You are not authorized to update this record.' });
         }
    }


    db.attendance[recordIndex] = {
        ...currentRecord,
        studentId: studentId || currentRecord.studentId,
        subjectId: subjectId || currentRecord.subjectId,
        date: date || currentRecord.date,
        status: status || currentRecord.status,
    };
    saveDB();
    res.json(db.attendance[recordIndex]);
};

const deleteAttendance = (req, res) => {
    const { id } = req.params;
    const db = getDB();
    const initialCount = db.attendance.length;

    const recordToDelete = db.attendance.find(a => a.id === id);
    if (!recordToDelete) {
        return res.status(404).json({ message: 'Attendance record not found.' });
    }
    if (req.user.role !== 'faculty') { // Only faculty can delete attendance
        return res.status(403).json({ message: 'Access denied. Only faculty can delete attendance.' });
    }
    // Ensure faculty is authorized to delete this specific record
    if (recordToDelete.facultyId !== req.user.id) {
        const facultyProfile = db.faculty.find(f => f.id === req.user.id);
        if (!facultyProfile || !facultyProfile.studentIds.includes(recordToDelete.studentId) || facultyProfile.subjectId !== recordToDelete.subjectId) {
            return res.status(403).json({ message: 'Access denied. You are not authorized to delete this record.' });
        }
    }

    db.attendance = db.attendance.filter(a => a.id !== id);
    if (db.attendance.length === initialCount) {
        return res.status(404).json({ message: 'Attendance record not found.' });
    }
    saveDB();
    res.status(204).send();
};

module.exports = {
    getAttendance,
    getAttendanceById,
    createAttendance,
    updateAttendance,
    deleteAttendance
};