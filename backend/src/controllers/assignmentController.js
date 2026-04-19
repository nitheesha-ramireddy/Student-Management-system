// backend/src/controllers/assignmentController.js
const { getDB, saveDB } = require('../db/db');
const { v4: uuidv4 } = require('uuid');

const getAssignments = (req, res) => {
    const db = getDB();
    // Faculty sees their own, students see assignments for their subjects
    if (req.user.role === 'faculty') {
        const facultyProfile = db.faculty.find(f => f.id === req.user.id);
        if (!facultyProfile) return res.status(404).json({ message: 'Faculty profile not found.' });
        const filteredAssignments = db.assignments.filter(a => a.facultyId === req.user.id);
        return res.json(filteredAssignments);
    }
    if (req.user.role === 'student') {
        const studentProfile = db.students.find(s => s.id === req.user.id);
        if (!studentProfile) return res.status(404).json({ message: 'Student profile not found.' });
        const filteredAssignments = db.assignments.filter(a => studentProfile.subjectIds.includes(a.subjectId));
        return res.json(filteredAssignments);
    }
    res.json(db.assignments); // Admin can see all
};

const getAssignmentById = (req, res) => {
    const { id } = req.params;
    const db = getDB();
    const assignment = db.assignments.find(a => a.id === id);
    if (!assignment) {
        return res.status(404).json({ message: 'Assignment not found.' });
    }
    // Basic authorization
    if (req.user.role === 'faculty' && assignment.facultyId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied.' });
    }
    if (req.user.role === 'student') {
        const studentProfile = db.students.find(s => s.id === req.user.id);
        if (!studentProfile || !studentProfile.subjectIds.includes(assignment.subjectId)) {
            return res.status(403).json({ message: 'Access denied. Assignment not for your subject.' });
        }
    }
    res.json(assignment);
};

const createAssignment = (req, res) => {
    const { title, description, subjectId, dueDate } = req.body;
    if (!title || !description || !subjectId || !dueDate) {
        return res.status(400).json({ message: 'Missing required fields.' });
    }
    if (req.user.role !== 'faculty') {
        return res.status(403).json({ message: 'Only faculty can create assignments.' });
    }
    const db = getDB();
    // Ensure faculty is authorized for this subject
    const facultyProfile = db.faculty.find(f => f.id === req.user.id);
    if (!facultyProfile || facultyProfile.subjectId !== subjectId) {
        return res.status(403).json({ message: 'Unauthorized to create assignment for this subject.' });
    }

    const newAssignment = {
        id: `assign-${uuidv4()}`,
        title, description, subjectId, facultyId: req.user.id, dueDate,
        createdAt: new Date().toISOString(),
        submissions: []
    };
    db.assignments.push(newAssignment);
    saveDB();
    res.status(201).json(newAssignment);
};

const updateAssignment = (req, res) => {
    const { id } = req.params;
    const { title, description, subjectId, dueDate } = req.body;
    const db = getDB();
    const assignmentIndex = db.assignments.findIndex(a => a.id === id);

    if (assignmentIndex === -1) {
        return res.status(404).json({ message: 'Assignment not found.' });
    }
    if (req.user.role !== 'faculty' || db.assignments[assignmentIndex].facultyId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied. Only the assigned faculty can update this assignment.' });
    }

    const currentAssignment = db.assignments[assignmentIndex];
    db.assignments[assignmentIndex] = {
        ...currentAssignment,
        title: title || currentAssignment.title,
        description: description || currentAssignment.description,
        subjectId: subjectId || currentAssignment.subjectId,
        dueDate: dueDate || currentAssignment.dueDate,
    };
    saveDB();
    res.json(db.assignments[assignmentIndex]);
};

const deleteAssignment = (req, res) => {
    const { id } = req.params;
    const db = getDB();
    const initialCount = db.assignments.length;

    const assignmentToDelete = db.assignments.find(a => a.id === id);
    if (!assignmentToDelete) {
        return res.status(404).json({ message: 'Assignment not found.' });
    }
    if (req.user.role !== 'faculty' || assignmentToDelete.facultyId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied. Only the assigned faculty can delete this assignment.' });
    }

    db.assignments = db.assignments.filter(a => a.id !== id);
    saveDB();
    if (db.assignments.length === initialCount) {
        return res.status(404).json({ message: 'Assignment not found.' });
    }
    res.status(204).send();
};

const submitAssignment = (req, res) => {
    const { id } = req.params; // Assignment ID
    const { fileName, fileUrl } = req.body; // Simulated file details
    if (!fileName || !fileUrl) {
        return res.status(400).json({ message: 'File name and URL are required for submission.' });
    }
    if (req.user.role !== 'student') {
        return res.status(403).json({ message: 'Only students can submit assignments.' });
    }

    const db = getDB();
    const assignmentIndex = db.assignments.findIndex(a => a.id === id);
    if (assignmentIndex === -1) {
        return res.status(404).json({ message: 'Assignment not found.' });
    }

    const newSubmission = {
        id: `sub-${uuidv4()}`,
        assignmentId: id,
        studentId: req.user.id,
        studentName: req.user.name,
        fileName,
        fileUrl, // In a real app, this would be a path to a stored file
        submittedAt: new Date().toISOString()
    };

    // Check if student has already submitted
    const existingSubmission = db.assignments[assignmentIndex].submissions.find(s => s.studentId === req.user.id);
    if (existingSubmission) {
        return res.status(409).json({ message: 'You have already submitted this assignment. Use update submission if allowed.' });
    }

    db.assignments[assignmentIndex].submissions.push(newSubmission);
    saveDB();
    res.status(201).json({ message: 'Assignment submitted successfully!', submission: newSubmission });
};


module.exports = {
    getAssignments,
    getAssignmentById,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    submitAssignment
};