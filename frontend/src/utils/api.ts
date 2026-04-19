// frontend/src/utils/api.ts

import axios from 'axios';
import { User, Student, Faculty, Subject, AttendanceRecord, Assignment, Notice, Grade, AssignmentSubmission } from '../types';

// Set your backend API base URL
const API_BASE_URL = 'http://localhost:5000/api'; // Matches your backend server.js port

// Create an Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle token expiration or invalid tokens
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 403) {
      // For instance, if token is expired or invalid, log out
      console.error("Authentication expired or invalid. Logging out...");
      localStorage.removeItem('jwtToken');
      // You might also want to clear current user from state and redirect to login
      // window.location.href = '/'; // Redirect to home/login page
    }
    return Promise.reject(error);
  }
);


// --- Authentication API Calls ---
export const authApi = {
  login: async (name: string, password: string): Promise<{ token: string; user: User }> => {
    const response = await api.post('/auth/login', { name, password });
    localStorage.setItem('jwtToken', response.data.token); // Save token
    return response.data;
  },
  register: async (name: string, password: string, email: string, role: 'student' | 'faculty'): Promise<{ token: string; user: User }> => {
    const response = await api.post('/auth/register', { name, password, email, role });
    localStorage.setItem('jwtToken', response.data.token); // Save token
    return response.data;
  },
  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await api.put('/auth/change-password', { currentPassword, newPassword });
  },
  // No explicit logout API call, just client-side token removal
  logout: () => {
    localStorage.removeItem('jwtToken');
  }
};

// --- User Profile API Call ---
export const userApi = {
  getProfile: async (): Promise<User> => {
    const response = await api.get('/users/profile');
    return response.data;
  }
};


// --- Data Management API Calls ---

export const studentApi = {
  getAll: async (): Promise<Student[]> => {
    const response = await api.get('/students');
    return response.data;
  },
  getById: async (id: string): Promise<Student> => {
    const response = await api.get(`/students/${id}`);
    return response.data;
  },
  create: async (student: Partial<Student>): Promise<Student> => {
    const response = await api.post('/students', student);
    return response.data;
  },
  update: async (id: string, updates: Partial<Student>): Promise<Student> => {
    const response = await api.put(`/students/${id}`, updates);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/students/${id}`);
  },
};

export const facultyApi = {
  getAll: async (): Promise<Faculty[]> => {
    const response = await api.get('/faculty');
    return response.data;
  },
  getById: async (id: string): Promise<Faculty> => {
    const response = await api.get(`/faculty/${id}`);
    return response.data;
  },
  create: async (faculty: Partial<Faculty>): Promise<Faculty> => {
    const response = await api.post('/faculty', faculty);
    return response.data;
  },
  update: async (id: string, updates: Partial<Faculty>): Promise<Faculty> => {
    const response = await api.put(`/faculty/${id}`, updates);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/faculty/${id}`);
  },
};

export const subjectApi = {
  getAll: async (): Promise<Subject[]> => {
    const response = await api.get('/subjects');
    return response.data;
  },
  getById: async (id: string): Promise<Subject> => {
    const response = await api.get(`/subjects/${id}`);
    return response.data;
  },
  create: async (subject: Partial<Subject>): Promise<Subject> => {
    const response = await api.post('/subjects', subject);
    return response.data;
  },
  update: async (id: string, updates: Partial<Subject>): Promise<Subject> => {
    const response = await api.put(`/subjects/${id}`, updates);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/subjects/${id}`);
  },
};

export const attendanceApi = {
  getAll: async (): Promise<AttendanceRecord[]> => {
    const response = await api.get('/attendance');
    return response.data;
  },
  getById: async (id: string): Promise<AttendanceRecord> => {
    const response = await api.get(`/attendance/${id}`);
    return response.data;
  },
  create: async (record: Omit<AttendanceRecord, 'id'>): Promise<AttendanceRecord> => {
    const response = await api.post('/attendance', record);
    return response.data;
  },
  update: async (id: string, updates: Partial<AttendanceRecord>): Promise<AttendanceRecord> => {
    const response = await api.put(`/attendance/${id}`, updates);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/attendance/${id}`);
  },
};

export const assignmentApi = {
  getAll: async (): Promise<Assignment[]> => {
    const response = await api.get('/assignments');
    return response.data;
  },
  getById: async (id: string): Promise<Assignment> => {
    const response = await api.get(`/assignments/${id}`);
    return response.data;
  },
  create: async (assignment: Omit<Assignment, 'id' | 'submissions' | 'createdAt'>): Promise<Assignment> => {
    const response = await api.post('/assignments', assignment);
    return response.data;
  },
  update: async (id: string, updates: Partial<Assignment>): Promise<Assignment> => {
    const response = await api.put(`/assignments/${id}`, updates);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/assignments/${id}`);
  },
  submit: async (assignmentId: string, fileName: string, fileUrl: string): Promise<AssignmentSubmission> => {
    const response = await api.post(`/assignments/${assignmentId}/submit`, { fileName, fileUrl });
    return response.data.submission;
  }
};

export const noticeApi = {
  getAll: async (): Promise<Notice[]> => {
    const response = await api.get('/notices');
    return response.data;
  },
  getById: async (id: string): Promise<Notice> => {
    const response = await api.get(`/notices/${id}`);
    return response.data;
  },
  create: async (notice: Omit<Notice, 'id' | 'createdAt'>): Promise<Notice> => {
    const response = await api.post('/notices', notice);
    return response.data;
  },
  update: async (id: string, updates: Partial<Notice>): Promise<Notice> => {
    const response = await api.put(`/notices/${id}`, updates);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/notices/${id}`);
  },
};

export const gradeApi = {
  getAll: async (): Promise<Grade[]> => {
    const response = await api.get('/grades');
    return response.data;
  },
  getById: async (id: string): Promise<Grade> => {
    const response = await api.get(`/grades/${id}`);
    return response.data;
  },
  create: async (grade: Omit<Grade, 'id' | 'createdAt'>): Promise<Grade> => {
    const response = await api.post('/grades', grade);
    return response.data;
  },
  update: async (id: string, updates: Partial<Grade>): Promise<Grade> => {
    const response = await api.put(`/grades/${id}`, updates);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/grades/${id}`);
  },
};