// frontend/src/components/StudentDashboard.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, Calendar, FileText, Bell, Award, Settings, LogOut, Key, AlertCircle, Loader2, CheckCircle } from 'lucide-react'; // Removed unused React import
import { User, Student, AttendanceRecord, Assignment, Notice, Grade, Subject, AssignmentSubmission } from '../types';
import { userApi, attendanceApi, assignmentApi, noticeApi, gradeApi, subjectApi, authApi } from '../utils/api'; // Removed unused studentApi

interface StudentDashboardProps {
  user: User;
  onLogout: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [studentProfile, setStudentProfile] = useState<Student | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);

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

  const [uploadingAssignmentId, setUploadingAssignmentId] = useState<string | null>(null);


  const loadData = useCallback(async () => {
    setIsLoadingData(true);
    setDataError(null);
    try {
      const profileResponse = await userApi.getProfile();
      // Explicitly check role and cast
      if (profileResponse.role === 'student') {
        setStudentProfile(profileResponse as Student);
      } else {
        throw new Error("User profile mismatch: Expected student, got " + profileResponse.role);
      }

      const fetchedSubjects = await subjectApi.getAll();
      setAllSubjects(fetchedSubjects);

      const fetchedAttendance = await attendanceApi.getAll();
      setAttendance(fetchedAttendance);

      const fetchedAssignments = await assignmentApi.getAll();
      // Filter assignments relevant to student's subjects from the fetched profile
      const studentSubjectIds = (profileResponse as Student).subjectIds || [];
      const relevantAssignments = fetchedAssignments.filter(a => studentSubjectIds.includes(a.subjectId));
      setAssignments(relevantAssignments);

      const fetchedNotices = await noticeApi.getAll();
      const relevantNotices = fetchedNotices.filter(n => studentSubjectIds.includes(n.subjectId));
      setNotices(relevantNotices);

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


  // --- Attendance Calculations ---
  const calculateAttendancePercentage = () => {
    if (!attendance || attendance.length === 0) return 0;
    const presentCount = attendance.filter(record => record.status === 'present').length;
    return Math.round((presentCount / attendance.length) * 100);
  };

  const getAttendanceStatusDescription = (percentage: number) => {
    if (percentage >= 85) return "Good";
    if (percentage >= 75) return "Warning";
    return "Shortage";
  };

  // --- Grade Calculations ---
  const calculateGPA = () => {
    if (!grades || grades.length === 0) return 0.0;
    const totalPoints = grades.reduce((sum, grade) => sum + grade.points, 0);
    return parseFloat((totalPoints / grades.length).toFixed(2));
  };


  // --- Assignment Submission ---
  const handleFileUpload = async (assignmentId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploadingAssignmentId(assignmentId);
    try {
      const simulatedFileUrl = URL.createObjectURL(file); // Example local URL for demo

      const response = await assignmentApi.submit(assignmentId, file.name, simulatedFileUrl);
      
      setAssignments(prevAssignments => prevAssignments.map(assign =>
        assign.id === assignmentId
          ? { ...assign, submissions: [...assign.submissions, response] } // Add the new submission from API response
          : assign
      ));

      alert(`Assignment '${file.name}' submitted successfully!`);
      // No need to revokeObjectURL immediately if URL is for display and state is updated.
      // If URL.createObjectURL was used only for backend transfer, you'd revoke it here.
    } catch (error: any) {
      console.error('Failed to submit assignment:', error);
      alert('Failed to submit assignment: ' + (error.response?.data?.message || 'Server error'));
    } finally {
      setUploadingAssignmentId(null);
    }
  };

  const isAssignmentSubmitted = (assignment: Assignment) => {
    return assignment.submissions.some(sub => sub.studentId === user.id);
  };

  const getSubmissionForAssignment = (assignment: Assignment): AssignmentSubmission | undefined => {
    return assignment.submissions.find(sub => sub.studentId === user.id);
  };


  // --- Password Change ---
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    // The backend's changePassword endpoint will verify the currentPassword against the stored hashed password.
    // The `user` object on the frontend does not contain the password for security.
    // Thus, client-side validation of current password against `user.password` is not possible here.
    // The backend API handles the real current password verification.
    // For a simple demo:
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
      
      onLogout(); // Force re-login with new password to update client-side auth.
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
          <Loader2 className="animate-spin h-32 w-32 text-emerald-600 mx-auto" />
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


  const currentAttendancePercentage = calculateAttendancePercentage();
  const currentGPA = calculateGPA();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-600 p-2 rounded-full">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{user.name}</h2>
              <p className="text-sm text-gray-500">Student</p>
            </div>
          </div>
        </div>

        <nav className="mt-6 flex-1">
          {['dashboard', 'attendance', 'assignments', 'notices', 'grades', 'settings'].map((tabId) => (
            <button
              key={tabId}
              onClick={() => setActiveTab(tabId)}
              className={`w-full flex items-center space-x-3 px-6 py-3 text-left transition-colors ${
                activeTab === tabId
                  ? 'bg-emerald-50 text-emerald-600 border-r-2 border-emerald-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tabId === 'dashboard' && <BookOpen className="h-5 w-5" />}
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
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Student Dashboard</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Attendance</p>
                      <p className="text-2xl font-bold text-gray-900">{currentAttendancePercentage}%</p>
                    </div>
                    <Calendar className={`h-8 w-8 ${
                      getAttendanceStatusDescription(currentAttendancePercentage) === 'Good' ? 'text-green-600' :
                      getAttendanceStatusDescription(currentAttendancePercentage) === 'Warning' ? 'text-yellow-600' :
                      'text-red-600'
                    }`} />
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Assignments</p>
                      <p className="text-2xl font-bold text-gray-900">{assignments.length}</p>
                    </div>
                    <FileText className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Current GPA</p>
                      <p className="text-2xl font-bold text-gray-900">{currentGPA.toFixed(2)}</p>
                    </div>
                    <Award className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Notices</p>
                      <p className="text-2xl font-bold text-gray-900">{notices.length}</p>
                    </div>
                    <Bell className="h-8 w-8 text-orange-600" />
                  </div>
                </div>
              </div>

              {currentAttendancePercentage < 75 && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-8 flex items-center space-x-3">
                  <AlertCircle className="h-6 w-6 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-lg">Attendance Shortage!</h4>
                    <p className="text-sm">Your attendance is below 75%. Please ensure regular attendance to avoid academic penalties.</p>
                  </div>
                </div>
              )}

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
                      <p className="text-gray-500">No recent notices for your subjects.</p>
                    )}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold mb-4">Pending Assignments</h3>
                  <div className="space-y-3">
                    {assignments.length > 0 ? (
                      assignments.filter(assign => !isAssignmentSubmitted(assign)).slice(0, 3).map((assignment) => {
                        const dueDate = new Date(assignment.dueDate);
                        const isValidDueDate = !isNaN(dueDate.getTime()); // Check if dueDate is valid
                        const isOverdue = isValidDueDate && dueDate < new Date() && !isAssignmentSubmitted(assignment);
                        return (
                          <div key={assignment.id} className="p-3 bg-gray-50 rounded-lg">
                            <h4 className="font-medium text-gray-900">{assignment.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{assignment.description}</p>
                            <p className={`text-xs mt-2 ${isOverdue ? 'text-red-500 font-semibold' : 'text-gray-500'}`}>
                              Due: {isValidDueDate ? dueDate.toLocaleDateString() : 'Invalid Date'} {isOverdue && '(Overdue)'}
                            </p>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-gray-500">No pending assignments.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'attendance' && (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-8">My Attendance</h1>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Overall Attendance: {currentAttendancePercentage}%{' '}
                    <span className={`text-sm font-normal ${
                      getAttendanceStatusDescription(currentAttendancePercentage) === 'Good' ? 'text-green-600' :
                      getAttendanceStatusDescription(currentAttendancePercentage) === 'Warning' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      ({getAttendanceStatusDescription(currentAttendancePercentage)})
                    </span>
                  </h3>
                  <div className="space-y-4">
                    {attendance.length > 0 ? (
                      attendance.map((record) => {
                        const recordDate = new Date(record.date);
                        const isValidRecordDate = !isNaN(recordDate.getTime());
                        const subject = allSubjects.find(s => s.id === record.subjectId);
                        return (
                          <div key={record.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Calendar className="h-4 w-4 text-gray-600" />
                              <div>
                                <h3 className="font-medium text-gray-900">
                                  {isValidRecordDate ? recordDate.toLocaleDateString() : 'Invalid Date'}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {subject ? subject.name : 'Unknown Subject'}
                                </p>
                              </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              record.status === 'present' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-gray-500">No attendance records found.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'assignments' && (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-8">My Assignments</h1>
              <div className="space-y-6">
                {assignments.length > 0 ? (
                  assignments.map((assignment) => {
                    const submitted = isAssignmentSubmitted(assignment);
                    const submission = getSubmissionForAssignment(assignment);
                    const dueDate = new Date(assignment.dueDate);
                    const isValidDueDate = !isNaN(dueDate.getTime());
                    const isOverdue = isValidDueDate && dueDate < new Date() && !submitted;

                    return (
                      <div key={assignment.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900">{assignment.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">{assignment.description}</p>
                          </div>
                          {submitted ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                              <CheckCircle className="h-4 w-4 mr-1" /> Submitted
                            </span>
                          ) : (
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                               isOverdue ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {isOverdue ? 'Overdue' : 'Pending'}
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-gray-500 mb-4">
                          Due: {isValidDueDate ? dueDate.toLocaleDateString() : 'Invalid Date'}
                          {isOverdue && <span className="text-red-500 font-semibold ml-2">(Overdue)</span>}
                        </p>

                        {!submitted && (
                          <div className="mt-4">
                            <label htmlFor={`file-upload-${assignment.id}`} className="block text-sm font-medium text-gray-700 mb-2">
                              Upload Assignment
                            </label>
                            <input
                              type="file"
                              id={`file-upload-${assignment.id}`}
                              className="block w-full text-sm text-gray-900
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-lg file:border-0
                                file:text-sm file:font-semibold
                                file:bg-blue-50 file:text-blue-700
                                hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                              accept=".pdf,.doc,.docx,.txt"
                              onChange={(e) => handleFileUpload(assignment.id, e)}
                              disabled={uploadingAssignmentId === assignment.id}
                            />
                            {uploadingAssignmentId === assignment.id && (
                              <p className="text-blue-600 text-sm mt-2 flex items-center">
                                <Loader2 className="animate-spin mr-2" size={16} /> Uploading...
                              </p>
                            )}
                          </div>
                        )}

                        {submitted && submission && (
                          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <h4 className="text-sm font-medium text-green-800 mb-2">Submission Details:</h4>
                            <p className="text-sm text-green-700">File: {submission.fileName}</p>
                            <p className="text-sm text-green-700">Submitted: {new Date(submission.submittedAt).toLocaleString()}</p>
                            <a
                                href={submission.fileUrl} // This will be a dummy URL for this demo
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-blue-600 hover:underline mt-2 text-sm"
                            >
                                <FileText className="h-4 w-4 mr-1" /> View Submission
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-500">No assignments for your subjects.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'notices' && (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Notices</h1>
              <div className="space-y-6">
                {notices.length > 0 ? (
                  notices.map((notice) => {
                    const createdAtDate = new Date(notice.createdAt);
                    const isValidDate = !isNaN(createdAtDate.getTime());
                    return (
                      <div key={notice.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="text-xl font-semibold text-gray-900">{notice.title}</h3>
                        <p className="text-gray-700 mt-2">{notice.content}</p>
                        <p className="text-sm text-gray-500 mt-3">
                          Posted: {isValidDate ? createdAtDate.toLocaleDateString() : 'Invalid Date'}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-500">No notices for your subjects.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'grades' && (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-8">My Grades</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Current GPA</p>
                      <p className="text-2xl font-bold text-gray-900">{currentGPA.toFixed(2)}</p>
                    </div>
                    <Award className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Courses</p>
                      <p className="text-2xl font-bold text-gray-900">{grades.length}</p>
                    </div>
                    <BookOpen className="h-8 w-8 text-indigo-600" />
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Credit Hours</p>
                      <p className="text-2xl font-bold text-gray-900">{grades.length * 3}</p> {/* Assuming 3 credit hours per course for demo */}
                    </div>
                    <FileText className="h-8 w-8 text-teal-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Grade History</h3>
                  <div className="space-y-4">
                    {grades.length > 0 ? (
                      grades.map((grade) => {
                        const subject = allSubjects.find(s => s.id === grade.subjectId); // Ensure subject variable is properly typed
                        return (
                          <div key={grade.id} className="p-4 border border-gray-200 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium text-gray-900">
                                  {subject?.name || 'Unknown Subject'} {/* Use optional chaining for name */}
                                </h4>
                                <p className="text-sm text-gray-600">{grade.semester}</p>
                              </div>
                              <div className="text-right">
                                <span className="text-lg font-bold text-emerald-600">{grade.grade}</span>
                                <p className="text-sm text-gray-500">{grade.points} pts</p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-gray-500">No grades recorded yet.</p>
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
                        <p className="text-gray-600">Student ID:</p>
                        <p className="font-medium text-gray-900">{user.id}</p>
                        <p className="text-gray-600">Enrolled Subjects:</p>
                        <p className="font-medium text-gray-900">
                          {studentProfile?.subjectIds && studentProfile.subjectIds.length > 0
                            ? studentProfile.subjectIds.map((id: string) => allSubjects.find((s: Subject) => s.id === id)?.name).filter(Boolean).join(', ')
                            : 'N/A'}
                        </p>
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                  className="px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
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