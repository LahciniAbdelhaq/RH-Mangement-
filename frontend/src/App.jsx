import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Requests from './pages/Requests';
import LeaveManagement from './pages/LeaveManagement';
import Calendar from './pages/Calendar';
import Compliance from './pages/Compliance';
import Finance from './pages/Finance';
import Settings from './pages/Settings';
import Help from './pages/Help';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Notifications from './pages/Notifications';
import NotFound from './pages/NotFound';
import { useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  return user?.role === 'HR_MANAGER' ? children : <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="employees" element={<Employees />} />
            <Route path="requests" element={<Requests />} />
            <Route path="leave" element={<LeaveManagement />} />
            <Route path="calendar" element={<AdminRoute><Calendar /></AdminRoute>} />
            <Route path="compliance" element={<Compliance />} />
            <Route path="finance" element={<AdminRoute><Finance /></AdminRoute>} />
            <Route path="settings" element={<Settings />} />
            <Route path="help" element={<Help />} />
            <Route path="profile" element={<Profile />} />
            <Route path="notifications" element={<Notifications />} />
          </Route>

          {/* Catch-all route for 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
