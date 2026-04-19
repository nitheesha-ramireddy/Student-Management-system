// backend/src/controllers/noticeController.js
const { getDB, saveDB } = require('../db/db');
const { v4: uuidv4 } = require('uuid');

const getNotices = (req, res) => {
    const db = getDB();
    // Faculty sees their own, students see notices for their subjects
    if (req.user.role === 'faculty') {
        const filteredNotices = db.notices.filter(n => n.facultyId === req.user.id);
        return res.json(filteredNotices);
    }
    if (req.user.role === 'student') {
        const studentProfile = db.students.find(s => s.id === req.user.id);
        if (!studentProfile) return res.status(404).json({ message: 'Student profile not found.' });
        const filteredNotices = db.notices.filter(n => studentProfile.subjectIds.includes(n.subjectId));
        return res.json(filteredNotices);
    }
    res.json(db.notices); // Admin can see all
};

const getNoticeById = (req, res) => {
    const { id } = req.params;
    const db = getDB();
    const notice = db.notices.find(n => n.id === id);
    if (!notice) {
        return res.status(404).json({ message: 'Notice not found.' });
    }
    res.json(notice);
};

const createNotice = (req, res) => {
    const { title, content, subjectId } = req.body;
    if (!title || !content || !subjectId) {
        return res.status(400).json({ message: 'Missing required fields.' });
    }
    if (req.user.role !== 'faculty') {
        return res.status(403).json({ message: 'Only faculty can create notices.' });
    }
    const db = getDB();
    // Ensure faculty is authorized for this subject
    const facultyProfile = db.faculty.find(f => f.id === req.user.id);
    if (!facultyProfile || facultyProfile.subjectId !== subjectId) {
        return res.status(403).json({ message: 'Unauthorized to create notice for this subject.' });
    }

    const newNotice = {
        id: `notice-${uuidv4()}`,
        title, content, subjectId, facultyId: req.user.id,
        createdAt: new Date().toISOString()
    };
    db.notices.push(newNotice);
    saveDB();
    res.status(201).json(newNotice);
};

const updateNotice = (req, res) => {
    const { id } = req.params;
    const { title, content, subjectId } = req.body;
    const db = getDB();
    const noticeIndex = db.notices.findIndex(n => n.id === id);

    if (noticeIndex === -1) {
        return res.status(404).json({ message: 'Notice not found.' });
    }
    if (req.user.role !== 'faculty' || db.notices[noticeIndex].facultyId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied. Only the assigned faculty can update this notice.' });
    }

    const currentNotice = db.notices[noticeIndex];
    db.notices[noticeIndex] = {
        ...currentNotice,
        title: title || currentNotice.title,
        content: content || currentNotice.content,
        subjectId: subjectId || currentNotice.subjectId,
    };
    saveDB();
    res.json(db.notices[noticeIndex]);
};

const deleteNotice = (req, res) => {
    const { id } = req.params;
    const db = getDB();
    const initialCount = db.notices.length;

    const noticeToDelete = db.notices.find(n => n.id === id);
    if (!noticeToDelete) {
        return res.status(404).json({ message: 'Notice not found.' });
    }
    if (req.user.role !== 'faculty' || noticeToDelete.facultyId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied. Only the assigned faculty can delete this notice.' });
    }

    db.notices = db.notices.filter(n => n.id !== id);
    saveDB();
    if (db.notices.length === initialCount) {
        return res.status(404).json({ message: 'Notice not found.' });
    }
    res.status(204).send();
};

module.exports = {
    getNotices,
    getNoticeById,
    createNotice,
    updateNotice,
    deleteNotice
};