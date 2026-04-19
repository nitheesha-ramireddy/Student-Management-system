// frontend/src/App.tsx

import { useState, useEffect } from 'react'; // Removed 'React' as it's not directly used for JSX
import { LoginForm } from './components/LoginForm';
import { FacultyDashboard } from './components/FacultyDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { User } from './types';
import { userApi, authApi } from './utils/api';
import { Loader2 } from 'lucide-react'; // Import Loader2 for loading spinner

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authToken, setAuthToken] = useState<string | null>(localStorage.getItem('jwtToken'));

  useEffect(() => {
    const verifyAndLoadUser = async () => {
      if (authToken) {
        try {
          const userData = await userApi.getProfile();
          setUser(userData);
        } catch (error) {
          console.error('Failed to verify token or fetch user profile:', error);
          authApi.logout();
          setAuthToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    verifyAndLoadUser();
  }, [authToken]);

  const handleLogin = (token: string, userData: User) => {
    localStorage.setItem('jwtToken', token);
    setAuthToken(token);
    setUser(userData);
  };

  const handleLogout = () => {
    authApi.logout();
    setAuthToken(null);
    setUser(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-32 w-32 border-b-2 border-blue-600" />
          <p className="text-gray-600 mt-4">Loading application...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm onLogin={handleLogin} />;
  }

  if (user.role === 'faculty') {
    // TypeScript now understands user has faculty-specific properties if role is 'faculty'
    return <FacultyDashboard user={user} onLogout={handleLogout} />;
  }

  // Assuming 'student' is the other primary role
  // TypeScript now understands user has student-specific properties if role is 'student'
  return <StudentDashboard user={user} onLogout={handleLogout} />;
}

export default App;