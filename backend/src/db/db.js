// backend/src/db/db.js
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid'); // For generating unique IDs

const DATA_FILE = path.join(__dirname, 'data.json');

let db = {
    users: [],
    students: [],
    faculty: [],
    subjects: [],
    attendance: [],
    assignments: [],
    notices: [],
    grades: []
};

// Function to load data from the JSON file
const loadDB = () => {
    console.log(`[DB] Attempting to load DB from: ${DATA_FILE}`);
    if (fs.existsSync(DATA_FILE)) {
        try {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            if (data.trim() === '') {
                console.warn(`[DB] WARN: ${DATA_FILE} is empty. Initializing in-memory DB with empty structure.`);
                db = { users: [], students: [], faculty: [], subjects: [], attendance: [], assignments: [], notices: [], grades: [] };
            } else {
                db = JSON.parse(data);
                console.log(`[DB] Successfully loaded DB from ${DATA_FILE}.`);
            }
        } catch (error) {
            console.error(`[DB] ERROR: Could not parse ${DATA_FILE}. It might be corrupted. Re-initializing in-memory DB.`);
            db = { users: [], students: [], faculty: [], subjects: [], attendance: [], assignments: [], notices: [], grades: [] };
        }
    } else {
        console.log(`[DB] ${DATA_FILE} does not exist. It will be created on save.`);
        // No need to call saveDB here, initializeDefaultData will handle it.
    }
};

// Function to save data to the JSON file
const saveDB = () => {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf8');
        console.log(`[DB] Successfully saved DB to ${DATA_FILE}.`);
    } catch (error) {
        console.error(`[DB] ERROR: Failed to save DB to ${DATA_FILE}:`, error);
    }
};

// Default data initialization (with 5 faculty and 10 students SHARED across all faculty)
const initializeDefaultData = () => {
    // Only initialize if users array is completely empty, ensuring it runs once from a clean state
    if (db.users.length === 0) { // Check only db.users.length, as others should also be empty if it's truly fresh
        console.log("[DB] Initializing default backend data (5 faculty, 10 students SHARED)...");
        try {
            let allGeneratedUsers = [];
            let allGeneratedFaculty = [];
            let allGeneratedStudents = [];
            let allGeneratedAttendance = [];
            let allGeneratedAssignments = [];
            let allGeneratedNotices = [];
            let allGeneratedGrades = [];

            const commonPassword = 'password123';
            const today = new Date().toISOString().split('T')[0];
            const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            // --- 1. Define 5 base subjects ---
            const baseSubjects = [
                { id: uuidv4(), name: 'Computer Science I', code: 'CS101', facultyId: '', studentIds: [] },
                { id: uuidv4(), name: 'Calculus I', code: 'MA101', facultyId: '', studentIds: [] },
                { id: uuidv4(), name: 'Physics I', code: 'PH101', facultyId: '', studentIds: [] },
                { id: uuidv4(), name: 'Chemistry I', code: 'CH101', facultyId: '', studentIds: [] },
                { id: uuidv4(), name: 'Biology I', code: 'BI101', facultyId: '', studentIds: [] },
            ];
            db.subjects = baseSubjects; // Assign subjects to db early

            const allSubjectIds = baseSubjects.map(s => s.id);

            // --- 2. Generate 10 CORE Students (who will be shared by all faculty) ---
            const coreStudents = [];
            for (let i = 1; i <= 10; i++) {
                const studentId = uuidv4();
                const studentName = `Core Student ${i}`;
                const studentEmail = `corestudent${i}@school.edu`;

                const studentUser = {
                    id: studentId,
                    name: studentName,
                    password: commonPassword,
                    role: 'student',
                    email: studentEmail,
                    subjectIds: allSubjectIds, // This student is enrolled in ALL subjects
                };
                allGeneratedUsers.push(studentUser);

                const studentProfile = {
                    id: studentId,
                    name: studentName,
                    email: studentEmail,
                    subjectIds: allSubjectIds,
                    attendance: [],
                    grades: []
                };
                coreStudents.push(studentProfile); // Add to the coreStudents array
                allGeneratedStudents.push(studentProfile);
            }
            const coreStudentIds = coreStudents.map(s => s.id);

            // --- 3. Generate 5 Faculty Members and link ALL 10 core students to EACH ---
            for (let i = 0; i < 5; i++) {
                const facultyId = uuidv4();
                const facultyName = `Prof. ${String.fromCharCode(65 + i)}`; // Prof. A, Prof. B, etc.
                const facultyEmail = `prof${i + 1}@school.edu`;
                const facultySubject = baseSubjects[i]; // Assign subjects sequentially

                facultySubject.facultyId = facultyId; // Update subject to link this faculty

                const facultyUser = {
                    id: facultyId,
                    name: facultyName,
                    password: commonPassword,
                    role: 'faculty',
                    email: facultyEmail,
                    subjectId: facultySubject.id,
                    subjectName: facultySubject.name,
                    studentIds: coreStudentIds // Assign ALL 10 core student IDs
                };
                allGeneratedUsers.push(facultyUser);

                const facultyProfile = {
                    id: facultyId,
                    name: facultyName,
                    email: facultyEmail,
                    subjectId: facultySubject.id,
                    subjectName: facultySubject.name,
                    studentIds: coreStudentIds // Assign ALL 10 core student IDs
                };
                allGeneratedFaculty.push(facultyProfile);

                // --- Generate some sample data for this faculty and their subject/students ---
                // Sample Assignment (1 per faculty, for their subject)
                allGeneratedAssignments.push({
                    id: uuidv4(), title: `${facultySubject.code} - Major Project (${facultyName})`,
                    description: `Complete the major project for ${facultySubject.name}.`,
                    subjectId: facultySubject.id, facultyId: facultyId, dueDate: nextWeek,
                    createdAt: new Date().toISOString(), submissions: []
                });

                // Sample Notice (1 per faculty, for their subject)
                allGeneratedNotices.push({
                    id: uuidv4(), title: `Important: ${facultySubject.name} Updates`,
                    content: `Please check new materials for ${facultySubject.name} in your portal.`,
                    subjectId: facultySubject.id, facultyId: facultyId, createdAt: new Date().toISOString()
                });
            }

            // --- 4. Update Subjects with ALL core student IDs ---
            // Each subject should contain all 10 core students since they are enrolled in everything
            db.subjects = baseSubjects.map(subject => ({
                ...subject,
                studentIds: coreStudentIds
            }));

            // --- 5. Generate sample Attendance & Grades for each core student across ALL subjects/faculty ---
            coreStudents.forEach(student => {
                baseSubjects.forEach(subject => {
                    const facultyOfSubject = allGeneratedFaculty.find(f => f.subjectId === subject.id);
                    if (facultyOfSubject) {
                        // Sample Attendance (one per student per subject)
                        allGeneratedAttendance.push({
                            id: uuidv4(), studentId: student.id, subjectId: subject.id,
                            date: today, status: (Math.random() > 0.2 ? 'present' : 'absent'), // ~80% present
                            facultyId: facultyOfSubject.id
                        });

                        // Sample Grade (one per student per subject)
                        const grades = ['A', 'A-', 'B+', 'B', 'B-', 'C+'];
                        const points = [4.0, 3.7, 3.3, 3.0, 2.7, 2.3];
                        const randomGradeIndex = Math.floor(Math.random() * grades.length);
                        allGeneratedGrades.push({
                            id: uuidv4(), studentId: student.id, subjectId: subject.id,
                            facultyId: facultyOfSubject.id, semester: 'Fall 2024',
                            grade: grades[randomGradeIndex], points: points[randomGradeIndex],
                            createdAt: new Date().toISOString()
                        });
                    }
                });
            });


            // --- 6. Consolidate all generated data into the db object ---
            db.users = allGeneratedUsers;
            db.students = allGeneratedStudents;
            db.faculty = allGeneratedFaculty;
            // db.subjects is already updated within the loop
            db.attendance = allGeneratedAttendance;
            db.assignments = allGeneratedAssignments;
            db.notices = allGeneratedNotices;
            db.grades = allGeneratedGrades;

            saveDB(); // Save the newly generated data
            console.log("[DB] Default backend data initialized and saved (5 faculty, 10 students shared across all subjects).");

        } catch (error) {
            console.error("[DB] CRITICAL ERROR during data generation. data.json might be empty or malformed:", error);
            // Optionally, save an empty or default structure if generation totally fails
            // saveDB(); // This might save an empty object if an error occurs early
        }
    } else {
        console.log("[DB] Backend data.json already contains data (users array not empty). Skipping default initialization.");
    }
};

// Initial load when the module is imported
loadDB();
// After loading, ensure data is initialized if it's empty
initializeDefaultData();

module.exports = {
    getDB: () => db,
    saveDB,
    loadDB,
    initializeDefaultData // Export so it can be called explicitly for re-init
};