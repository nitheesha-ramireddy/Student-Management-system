// frontend/src/components/LoginForm.tsx

import React, { useState } from 'react'; // Keep React if using JSX directly
import { LogIn, UserPlus, GraduationCap, AlertCircle, Loader2 } from 'lucide-react';
import { User } from '../types';
import { authApi } from '../utils/api';

interface LoginFormProps {
  onLogin: (token: string, user: User) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    email: '',
    role: 'student' as 'student' | 'faculty',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const demoCredentials = [
    { name: 'Dr. Smith', role: 'faculty' },
    { name: 'Alice Wonderland', role: 'student' },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => { // Explicitly type Event to HTMLFormElement
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isLogin) {
        const response = await authApi.login(formData.name, formData.password);
        if (response.token && response.user) {
          onLogin(response.token, response.user);
        } else {
          setError('Login failed: Invalid response from server.');
        }
      } else {
        // Correctly access form elements by casting e.currentTarget
        const confirmPasswordInput = e.currentTarget.elements.namedItem('confirmPassword') as HTMLInputElement;
        const confirmPassword = confirmPasswordInput?.value || '';

        if (formData.password !== confirmPassword) {
          setError('Passwords do not match.');
          setIsLoading(false);
          return;
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters long.');
          setIsLoading(false);
          return;
        }

        const response = await authApi.register(formData.name, formData.password, formData.email, formData.role);
        if (response.token && response.user) {
          onLogin(response.token, response.user);
          alert('Registration successful! You are now logged in.');
        } else {
          setError('Registration failed: Invalid response from server.');
        }
      }
    } catch (err: any) {
      console.error('Authentication error:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-lg w-full transform transition-all duration-300 scale-100 opacity-100">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-600 p-4 rounded-full shadow-lg">
              <GraduationCap className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">School Management System</h1>
          <p className="text-gray-600 text-lg">
            {isLogin ? 'Sign in to your account' : 'Create your account'}
          </p>
        </div>

        <div className="flex justify-center mb-6 border-b border-gray-200">
          <button
            onClick={() => { setIsLogin(true); setError(''); }}
            className={`flex-1 py-3 px-6 text-center text-lg font-semibold transition-colors duration-200 ${
              isLogin ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <LogIn className="inline-block mr-2" size={20} /> Login
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(''); }}
            className={`flex-1 py-3 px-6 text-center text-lg font-semibold transition-colors duration-200 ${
              !isLogin ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <UserPlus className="inline-block mr-2" size={20} /> Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="name">
              Full Name (Username)
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out text-gray-900"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="password">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out text-gray-900"
              required
            />
          </div>

          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="email">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out text-gray-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out text-gray-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="role">
                  Select Role
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out text-gray-900"
                  required
                >
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                </select>
              </div>
            </>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative flex items-center space-x-2">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition duration-150 ease-in-out flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="animate-spin mr-2" size={20} /> : null}
            {isLoading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        {isLogin && (
          <div className="mt-8 text-center text-gray-600">
            <h3 className="font-semibold text-gray-800 mb-2">Demo Credentials (Password: `password123`)</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {demoCredentials.map((cred, index) => (
                <div key={index} className="bg-gray-100 p-2 rounded-md">
                  <p className="font-medium">{cred.name}</p>
                  <p className="text-xs text-gray-500">{cred.role.charAt(0).toUpperCase() + cred.role.slice(1)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};