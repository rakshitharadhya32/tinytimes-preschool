import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';
import ParentLayout from './components/ParentLayout';

import Login from './pages/Login';
import Dashboard from './pages/admin/Dashboard';
import Enrollment from './pages/admin/Enrollment';
import Students from './pages/admin/Students';
import StudentDetail from './pages/admin/StudentDetail';
import Staff from './pages/admin/Staff';
import Attendance from './pages/admin/Attendance';
import Announcements from './pages/admin/Announcements';
import Classrooms from './pages/admin/Classrooms';
import Billing from './pages/admin/Billing';

import ParentHome from './pages/parent/ParentHome';
import ParentFeed from './pages/parent/ParentFeed';
import ParentChildren from './pages/parent/ParentChildren';
import ParentBilling from './pages/parent/ParentBilling';

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'parent' ? '/parent' : '/admin'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['admin', 'staff']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="enrollment" element={<Enrollment />} />
            <Route path="students" element={<Students />} />
            <Route path="students/:id" element={<StudentDetail />} />
            <Route path="staff" element={<Staff />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="announcements" element={<Announcements />} />
            <Route path="classrooms" element={<Classrooms />} />
            <Route path="billing" element={<Billing />} />
          </Route>

          <Route
            path="/parent"
            element={
              <ProtectedRoute roles={['parent']}>
                <ParentLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ParentHome />} />
            <Route path="feed" element={<ParentFeed />} />
            <Route path="children" element={<ParentChildren />} />
            <Route path="billing" element={<ParentBilling />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
