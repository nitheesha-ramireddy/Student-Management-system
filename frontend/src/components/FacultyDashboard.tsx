// frontend/src/components/FacultyDashboard.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { Users, Calendar, FileText, Bell, Award, Settings, LogOut, BookOpen, Key, Loader2, AlertCircle } from 'lucide-react'; // Removed unused Plus, Edit, Trash2 icons
import { User, Student, AttendanceRecord, Assignment, Notice, Grade, Subject, Faculty } from '../types'; // Import Faculty type explicitly
import { studentApi, attendanceApi, assignmentApi, noticeApi, gradeApi, authApi, userApi, subjectApi } from '../utils/api'; // Removed facultyApi as it's not directly used for CUD here

interface FacultyDashboardProps {
  user: User;
  onLogout: () => void;
}

export const FacultyDashboard: React.FC<FacultyDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]); // To get subject names
  const [myFacultyProfile, setMyFacultyProfile] = useState<Faculty | null>(null); // Full faculty profile from backend

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);


  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    dueDate: ''
  });
  const [isCreatingAssignment, setIsCreatingAssignment] = useState(false);

  const [newNotice, setNewNotice] = useState({
    title: '',
    content: ''
  });
  const [isCreatingNotice, setIsCreatingNotice] = useState(false);

  const [newGrade, setNewGrade] = useState({
    studentId: '',
    semester: '',
    grade: '',
    points: 0 // Will be derived from grade
  });
  const [isAssigningGrade, setIsAssigningGrade] = useState(false);


  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const loadData = useCallback(async () => {
    setIsLoadingData(true);
    setDataError(null);
    try {
      const profileResponse = await userApi.getProfile();
      if (profileResponse.role === 'faculty') {
        setMyFacultyProfile(profileResponse as Faculty);
      } else {
        throw new Error("User profile mismatch: Expected faculty, got " + profileResponse.role);
      }

      const fetchedStudents = await studentApi.getAll();
      setStudents(fetchedStudents);

      const fetchedSubjects = await subjectApi.getAll();
      setAllSubjects(fetchedSubjects);

      const fetchedAttendance = await attendanceApi.getAll();
      setAttendance(fetchedAttendance);

      const fetchedAssignments = await assignmentApi.getAll();
      setAssignments(fetchedAssignments);

      const fetchedNotices = await noticeApi.getAll();
      setNotices(fetchedNotices);

      const fetchedGrades = await gradeApi.getAll();
      setGrades(fetchedGrades);

    } catch (error: any) {
      console.error('Failed to load dashboard data:', error);
      setDataError(error.response?.data?.message || 'Failed to load data. Please try again.');
      if (error.response?.status === 403 || error.response?.status === 401) {
        onLogout();
      }
    } finally {
      setIsLoadingData(false);
    }
  }, [onLogout]); // Removed user.id from deps as it's stable and loadData already triggered by initial user state

  useEffect(() => {
    loadData();
  }, [loadData]);


  // --- Attendance Management ---
  const handleAttendanceChange = async (studentId: string, status: 'present' | 'absent') => {
    // Ensure facultyProfile and subjectId are available
    if (!myFacultyProfile?.subjectId) {
        alert("Error: Faculty subject information not loaded.");
        return;
    }

    const existingRecord = attendance.find(
      record => record.studentId === studentId && record.date === selectedDate && record.subjectId === myFacultyProfile.subjectId
    );

    try {
      if (existingRecord) {
        await attendanceApi.update(existingRecord.id, { status });
      } else {
        await attendanceApi.create({
          studentId,
          subjectId: myFacultyProfile.subjectId, // Use myFacultyProfile.subjectId
          date: selectedDate,
          status,
          facultyId: user.id // user.id is correctly typed from User interface
        });
      }
      await loadData();
      alert('Attendance updated successfully!');
    } catch (error: any) {
      console.error('Failed to update attendance:', error);
      alert('Failed to update attendance: ' + (error.response?.data?.message || 'Server error'));
    }
  };

  const getAttendanceForStudent = (studentId: string) => {
    return attendance.find(record =>
      record.studentId === studentId && record.date === selectedDate
    )?.status || 'not-marked';
  };

  const calculateAttendancePercentage = (studentId: string) => {
    const studentAttendance = attendance.filter(record => record.studentId === studentId);
    if (studentAttendance.length === 0) return 0;
    const presentCount = studentAttendance.filter(record => record.status === 'present').length;
    return Math.round((presentCount / studentAttendance.length) * 100);
  };

  // --- Assignment Management ---
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssignment.title || !newAssignment.description || !newAssignment.dueDate) {
      alert('Please fill all assignment fields.');
      return;
    }
    if (!myFacultyProfile?.subjectId) {
        alert("Error: Faculty subject information not loaded.");
        return;
    }

    setIsCreatingAssignment(true);
    try {
      await assignmentApi.create({
        title: newAssignment.title,
        description: newAssignment.description,
        subjectId: myFacultyProfile.subjectId, // Use myFacultyProfile.subjectId
        dueDate: newAssignment.dueDate,
        facultyId: user.id,
      });
      setNewAssignment({ title: '', description: '', dueDate: '' });
      await loadData();
      alert('Assignment created successfully!');
    } catch (error: any) {
      console.error('Failed to create assignment:', error);
      alert('Failed to create assignment: ' + (error.response?.data?.message || 'Server error'));
    } finally {
      setIsCreatingAssignment(false);
    }
  };

  // --- Notice Management ---
  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotice.title || !newNotice.content) {
      alert('Please fill all notice fields.');
      return;
    }
    if (!myFacultyProfile?.subjectId) {
        alert("Error: Faculty subject information not loaded.");
        return;
    }

    setIsCreatingNotice(true);
    try {
      await noticeApi.create({
        title: newNotice.title,
        content: newNotice.content,
        subjectId: myFacultyProfile.subjectId, // Use myFacultyProfile.subjectId
        facultyId: user.id,
      });
      setNewNotice({ title: '', content: '' });
      await loadData();
      alert('Notice posted successfully!');
    } catch (error: any) {
      console.error('Failed to create notice:', error);
      alert('Failed to create notice: ' + (error.response?.data?.message || 'Server error'));
    } finally {
      setIsCreatingNotice(false);
    }
  };

  // --- Grade Management ---
  const handleCreateGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGrade.studentId || !newGrade.semester || !newGrade.grade) {
      alert('Please select a student, semester, and grade.');
      return;
    }
    if (!myFacultyProfile?.subjectId) {
        alert("Error: Faculty subject information not loaded.");
        return;
    }

    setIsAssigningGrade(true);
    try {
      await gradeApi.create({
        studentId: newGrade.studentId,
        subjectId: myFacultyProfile.subjectId, // Use myFacultyProfile.subjectId
        semester: newGrade.semester,
        grade: newGrade.grade,
        points: newGrade.points,
        facultyId: user.id,
      });
      setNewGrade({ studentId: '', semester: '', grade: '', points: 0 });
      await loadData();
      alert('Grade assigned successfully!');
    } catch (error: any) {
      console.error('Failed to assign grade:', error);
      alert('Failed to assign grade: ' + (error.response?.data?.message || 'Server error'));
    } finally {
      setIsAssigningGrade(false);
    }
  };

  // --- Password Change ---
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    // The backend's changePassword endpoint will verify the currentPassword against the stored hashed password.
    // The `user` object on the frontend does not contain the password for security.
    // Thus, client-side validation of current password against `user.password` is not possible here.
    // The backend API handles the real current password verification.
    // For this demo, we can just proceed assuming the backend will handle the verification.

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await authApi.changePassword(passwordData.currentPassword, passwordData.newPassword);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordModal(false);
      
      // Force re-login with new password to update client-side auth.
      // This is a common security practice after password change.
      onLogout(); 
      alert('Password changed successfully! Please log in with your new password.');

    } catch (error: any) {
      console.error('Failed to change password:', error);
      setPasswordError(error.response?.data?.message || 'Failed to change password.');
    } finally {
      setIsChangingPassword(false);
    }
  };


  // --- Render Logic ---
  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-32 w-32 text-blue-600 mx-auto" />
          <p className="text-gray-600 mt-4">Loading your dashboard data...</p>
        </div>
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="min-h-screen bg-red-100 flex flex-col items-center justify-center p-4">
        <AlertCircle className="h-16 w-16 text-red-600 mb-4" />
        <h2 className="text-2xl font-bold text-red-800 mb-2">Error Loading Data</h2>
        <p className="text-red-700 text-center">{dataError}</p>
        <button
          onClick={loadData}
          className="mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
        >
          Retry Load Data
        </button>
        <button
          onClick={onLogout}
          className="mt-2 bg-gray-300 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-400"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-full">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{user.name}</h2>
              <p className="text-sm text-gray-500">{myFacultyProfile?.subjectName || 'Loading Subject...'}</p>
            </div>
          </div>
        </div>

        <nav className="mt-6 flex-1">
          {['dashboard', 'students', 'attendance', 'assignments', 'notices', 'grades', 'settings'].map((tabId) => (
            <button
              key={tabId}
              onClick={() => setActiveTab(tabId)}
              className={`w-full flex items-center space-x-3 px-6 py-3 text-left transition-colors ${
                activeTab === tabId
                  ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tabId === 'dashboard' && <BookOpen className="h-5 w-5" />}
              {tabId === 'students' && <Users className="h-5 w-5" />}
              {tabId === 'attendance' && <Calendar className="h-5 w-5" />}
              {tabId === 'assignments' && <FileText className="h-5 w-5" />}
              {tabId === 'notices' && <Bell className="h-5 w-5" />}
              {tabId === 'grades' && <Award className="h-5 w-5" />}
              {tabId === 'settings' && <Settings className="h-5 w-5" />}
              <span className="font-medium capitalize">{tabId}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto p-6 border-t">
          <button
            onClick={() => setShowPasswordModal(true)}
            className="w-full flex items-center justify-center space-x-3 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors mb-2"
          >
            <Key className="h-5 w-5" />
            <span>Change Password</span>
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center space-x-3 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {activeTab === 'dashboard' && (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Faculty Dashboard</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Students</p>
                      {/* Filter students based on faculty's assigned student IDs */}
                      <p className="text-2xl font-bold text-gray-900">{students.filter(s => myFacultyProfile?.studentIds?.includes(s.id)).length}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Active Assignments</p>
                      <p className="text-2xl font-bold text-gray-900">{assignments.length}</p>
                    </div>
                    <FileText className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Notices Posted</p>
                      <p className="text-2xl font-bold text-gray-900">{notices.length}</p>
                    </div>
                    <Bell className="h-8 w-8 text-yellow-600" />
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Grades Given</p>
                      <p className="text-2xl font-bold text-gray-900">{grades.length}</p>
                    </div>
                    <Award className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold mb-4">Recent Notices</h3>
                  <div className="space-y-3">
                    {notices.length > 0 ? (
                      notices.slice(0, 3).map((notice) => {
                        const createdAtDate = new Date(notice.createdAt);
                        const isValidDate = !isNaN(createdAtDate.getTime());
                        return (
                          <div key={notice.id} className="p-3 bg-gray-50 rounded-lg">
                            <h4 className="font-medium text-gray-900">{notice.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{notice.content}</p>
                            <p className="text-xs text-gray-500 mt-2">
                               Posted: {isValidDate ? createdAtDate.toLocaleDateString() : 'Invalid Date'}
                            </p>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-gray-500">No recent notices posted.</p>
                    )}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold mb-4">Student Attendance Overview</h3>
                  <div className="space-y-3">
                    {myFacultyProfile?.studentIds && myFacultyProfile.studentIds.length > 0 ? (
                      students.filter(s => myFacultyProfile?.studentIds?.includes(s.id)).slice(0, 5).map((student) => (
                        <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium text-gray-900">{student.name}</span>
                          <span className={`px-2 py-1 rounded text-sm ${
                            calculateAttendancePercentage(student.id) >= 75
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {calculateAttendancePercentage(student.id)}%
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">No students assigned to you yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'students' && (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-8">My Students</h1>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myFacultyProfile?.studentIds && myFacultyProfile.studentIds.length > 0 ? (
                      students.filter(s => myFacultyProfile.studentIds.includes(s.id)).map((student) => ( // Use myFacultyProfile.studentIds directly
                        <div key={student.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="bg-blue-600 p-2 rounded-full">
                              <Users className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{student.name}</h3>
                              <p className="text-sm text-gray-600">{student.email}</p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Attendance</span>
                              <span className={`px-2 py-1 rounded text-sm ${
                                calculateAttendancePercentage(student.id) >= 75
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {calculateAttendancePercentage(student.id)}%
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Grades</span>
                              <span className="text-sm font-medium text-gray-900">
                                {grades.filter(g => g.studentId === student.id && g.facultyId === user.id).length} recorded
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 col-span-3">No students assigned to you.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'attendance' && (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Attendance Management</h1>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6">
                  <div className="mb-6">
                    <label htmlFor="attendance-date" className="block text-sm font-medium text-gray-700 mb-2">
                      Select Date
                    </label>
                    <input
                      type="date"
                      id="attendance-date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-4">
                    {myFacultyProfile?.studentIds && myFacultyProfile.studentIds.length > 0 ? (
                      students.filter(s => myFacultyProfile.studentIds.includes(s.id)).map((student) => ( // Use myFacultyProfile.studentIds directly
                        <div key={student.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="bg-gray-100 p-2 rounded-full">
                              <Users className="h-4 w-4 text-gray-600" />
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">{student.name}</h3>
                              <p className="text-sm text-gray-600">{student.email}</p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleAttendanceChange(student.id, 'present')}
                              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                getAttendanceForStudent(student.id) === 'present'
                                  ? 'bg-green-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-green-50 hover:text-white'
                              }`}
                            >
                              Present
                            </button>
                            <button
                              onClick={() => handleAttendanceChange(student.id, 'absent')}
                              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                getAttendanceForStudent(student.id) === 'absent'
                                  ? 'bg-red-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-white'
                              }`}
                            >
                              Absent
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">No students assigned to you for attendance marking.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'assignments' && (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Assignment Management</h1>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold mb-4">Create New Assignment</h3>
                  <form onSubmit={handleCreateAssignment} className="space-y-4">
                    <div>
                      <label htmlFor="assignment-title" className="block text-sm font-medium text-gray-700 mb-2">
                        Assignment Title
                      </label>
                      <input
                        type="text"
                        id="assignment-title"
                        value={newAssignment.title}
                        onChange={(e) => setNewAssignment({...newAssignment, title: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="assignment-description" className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        id="assignment-description"
                        value={newAssignment.description}
                        onChange={(e) => setNewAssignment({...newAssignment, description: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="assignment-due-date" className="block text-sm font-medium text-gray-700 mb-2">
                        Due Date
                      </label>
                      <input
                        type="date"
                        id="assignment-due-date"
                        value={newAssignment.dueDate}
                        onChange={(e) => setNewAssignment({...newAssignment, dueDate: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isCreatingAssignment}
                    >
                      {isCreatingAssignment ? <Loader2 className="animate-spin mr-2" size={20} /> : null}
                      {isCreatingAssignment ? 'Creating...' : 'Create Assignment'}
                    </button>
                  </form>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold mb-4">Active Assignments</h3>
                  <div className="space-y-4">
                    {assignments.length > 0 ? (
                      assignments.map((assignment) => (
                        <div key={assignment.id} className="p-4 border border-gray-200 rounded-lg">
                          <h4 className="font-medium text-gray-900">{assignment.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{assignment.description}</p>
                          <div className="flex justify-between items-center mt-3">
                            <span className="text-sm text-gray-500">
                              Due: {new Date(assignment.dueDate).toLocaleDateString()}
                            </span>
                            <span className="text-sm text-blue-600">
                              {assignment.submissions.length} submissions
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">No assignments created yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notices' && (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Notices Management</h1>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold mb-4">Create New Notice</h3>
                  <form onSubmit={handleCreateNotice} className="space-y-4">
                    <div>
                      <label htmlFor="notice-title" className="block text-sm font-medium text-gray-700 mb-2">
                        Notice Title
                      </label>
                      <input
                        type="text"
                        id="notice-title"
                        value={newNotice.title}
                        onChange={(e) => setNewNotice({...newNotice, title: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="notice-content" className="block text-sm font-medium text-gray-700 mb-2">
                        Content
                      </label>
                      <textarea
                        id="notice-content"
                        value={newNotice.content}
                        onChange={(e) => setNewNotice({...newNotice, content: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={4}
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isCreatingNotice}
                    >
                      {isCreatingNotice ? <Loader2 className="animate-spin mr-2" size={20} /> : null}
                      {isCreatingNotice ? 'Posting...' : 'Post Notice'}
                    </button>
                  </form>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold mb-4">Recent Notices</h3>
                  <div className="space-y-4">
                    {notices.length > 0 ? (
                      notices.map((notice) => {
                        const createdAtDate = new Date(notice.createdAt);
                        const isValidDate = !isNaN(createdAtDate.getTime());
                        return (
                          <div key={notice.id} className="p-4 border border-gray-200 rounded-lg">
                            <h4 className="font-medium text-gray-900">{notice.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{notice.content}</p>
                            <p className="text-xs text-gray-500 mt-2">
                               Posted: {isValidDate ? createdAtDate.toLocaleDateString() : 'Invalid Date'}
                            </p>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-gray-500">No notices posted yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'grades' && (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Grade Management</h1>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold mb-4">Assign Grade</h3>
                  <form onSubmit={handleCreateGrade} className="space-y-4">
                    <div>
                      <label htmlFor="grade-student" className="block text-sm font-medium text-gray-700 mb-2">
                        Student
                      </label>
                      <select
                        id="grade-student"
                        value={newGrade.studentId}
                        onChange={(e) => setNewGrade({...newGrade, studentId: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Select Student</option>
                        {/* Filter students based on faculty's assigned student IDs for the dropdown */}
                        {myFacultyProfile?.studentIds && students.filter(s => myFacultyProfile.studentIds.includes(s.id)).map((student) => (
                          <option key={student.id} value={student.id}>{student.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="grade-semester" className="block text-sm font-medium text-gray-700 mb-2">
                        Semester
                      </label>
                      <input
                        type="text"
                        id="grade-semester"
                        value={newGrade.semester}
                        onChange={(e) => setNewGrade({...newGrade, semester: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Fall 2024"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="grade-letter" className="block text-sm font-medium text-gray-700 mb-2">
                        Grade
                      </label>
                      <select
                        id="grade-letter"
                        value={newGrade.grade}
                        onChange={(e) => {
                          const grade = e.target.value;
                          const points = grade === 'A' ? 4.0 : grade === 'A-' ? 3.7 : grade === 'B+' ? 3.3 : grade === 'B' ? 3.0 : grade === 'B-' ? 2.7 : grade === 'C+' ? 2.3 : grade === 'C' ? 2.0 : grade === 'C-' ? 1.7 : grade === 'D+' ? 1.3 : grade === 'D' ? 1.0 : 0;
                          setNewGrade({...newGrade, grade, points});
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Select Grade</option>
                        <option value="A">A</option><option value="A-">A-</option>
                        <option value="B+">B+</option><option value="B">B</option><option value="B-">B-</option>
                        <option value="C+">C+</option><option value="C">C</option><option value="C-">C-</option>
                        <option value="D+">D+</option><option value="D">D</option>
                        <option value="F">F</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isAssigningGrade}
                    >
                      {isAssigningGrade ? <Loader2 className="animate-spin mr-2" size={20} /> : null}
                      {isAssigningGrade ? 'Assigning...' : 'Assign Grade'}
                    </button>
                  </form>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold mb-4">Assigned Grades</h3>
                  <div className="space-y-4">
                    {grades.length > 0 ? (
                      grades.map((grade) => {
                        const student = students.find(s => s.id === grade.studentId);
                        const subject = allSubjects.find(s => s.id === grade.subjectId);
                        return (
                          <div key={grade.id} className="p-4 border border-gray-200 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium text-gray-900">
                                  {student?.name || 'Unknown Student'}
                                </h4>
                                <p className="text-sm text-gray-600">{grade.semester}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {subject?.name || 'Unknown Subject'}
                                </p>
                              </div>
                              <div className="text-right">
                                <span className="text-lg font-bold text-blue-600">{grade.grade}</span>
                                <p className="text-sm text-gray-500">{grade.points} pts</p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-gray-500">No grades assigned yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Account Settings</h3>
                  <div className="space-y-4">
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Profile Information</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <p className="text-gray-600">Name:</p>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-gray-600">Email:</p>
                        <p className="font-medium text-gray-900">{user.email}</p>
                        <p className="text-gray-600">Role:</p>
                        <p className="font-medium text-gray-900 capitalize">{user.role}</p>
                        <p className="text-gray-600">Subject:</p>
                        <p className="font-medium text-gray-900">{myFacultyProfile?.subjectName || 'N/A'}</p>
                        <p className="text-gray-600">Students Managed:</p>
                        <p className="font-medium text-gray-900">{myFacultyProfile?.studentIds?.length || 0}</p>
                      </div>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Security</h4>
                      <button
                        onClick={() => setShowPasswordModal(true)}
                        className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                      >
                        Change Password
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Change Password</h3>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  id="current-password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  id="new-password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="confirm-new-password" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirm-new-password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {passwordError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    setPasswordError('');
                  }}
                  className="px-5 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? <Loader2 className="animate-spin mr-2" size={20} /> : null}
                  {isChangingPassword ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};