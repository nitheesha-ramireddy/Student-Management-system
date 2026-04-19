// frontend/src/types/index.ts

export interface User {
  id: string;
  name: string;
  password?: string; // Password is not sent to frontend, so it's optional here
  role: 'student' | 'faculty' | 'admin';
  email: string;

  // These properties are specific to roles but may be present on User object after fetching profile
  // They are optional on the base User interface because not all users will have them.
  // When casting (e.g., 'as Faculty'), TypeScript ensures they exist for the asserted type.
  subjectId?: string; // For faculty
  subjectName?: string; // For faculty
  studentIds?: string[]; // For faculty (students they manage)
  subjectIds?: string[]; // For student (subjects they are enrolled in)
}

// These are the *full* data structures as they exist on the backend and are typically fetched
// They include all properties that would be on the DB record.
export interface Student {
  id: string;
  name: string;
  email: string;
  subjectIds: string[]; // List of subject IDs student is enrolled in
  // Note: 'attendance' and 'grades' arrays are fetched via separate API calls
  // and are not directly part of the 'Student' object from the backend
  // but are managed in state in the StudentDashboard.tsx
}

export interface Faculty {
  id: string;
  name: string;
  email: string;
  subjectId: string; // The ID of the subject this faculty teaches
  subjectName: string; // The name of the subject this faculty teaches
  studentIds: string[]; // List of student IDs this faculty teaches/manages
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  facultyId: string; // ID of the faculty teaching this subject
  studentIds: string[]; // IDs of students enrolled in this subject
}

export interface AttendanceRecord {
  id: string;
  studentId: string; // Corrected: This property absolutely exists
  subjectId: string; // Corrected: This property absolutely exists
  date: string; // YYYY-MM-DD
  status: 'present' | 'absent';
  facultyId: string; // Who marked it
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  facultyId: string;
  dueDate: string; // YYYY-MM-DD
  createdAt: string; // ISO string
  submissions: AssignmentSubmission[];
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string; // Corrected: This property absolutely exists
  studentName: string;
  fileName: string;
  fileUrl: string; // URL to the submitted file (can be temporary/simulated)
  submittedAt: string; // ISO string
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  subjectId: string; // Corrected: This property absolutely exists
  facultyId: string;
  createdAt: string; // ISO string
}

export interface Grade {
  id: string;
  studentId: string; // Corrected: This property absolutely exists
  subjectId: string; // Corrected: This property absolutely exists
  facultyId: string;
  semester: string;
  grade: string; // e.g., "A", "B+", "C"
  points: number; // e.g., 4.0, 3.3, 2.0
  createdAt: string; // ISO string
}