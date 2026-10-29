import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import Login from './components/Login';
import Register from './components/Register';
import Profile from './components/Profile';
import CourseList from './components/CourseList';
import CourseDetail from './components/CourseDetail';
import CourseCreate from './components/CourseCreate';
import CourseEdit from './components/CourseEdit';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Загрузка...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function TeacherRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Загрузка...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
    return <Navigate to="/courses" replace />;
  }

  return children;
}

function AppContent() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Navigate to="/courses" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route path="/courses" element={<CourseList />} />
        <Route
          path="/courses/new"
          element={
            <TeacherRoute>
              <CourseCreate />
            </TeacherRoute>
          }
        />
        <Route path="/courses/:id" element={<CourseDetail />} />
        <Route
          path="/courses/:id/edit"
          element={
            <ProtectedRoute>
              <CourseEdit />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/courses" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;