import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Requests from './pages/Requests';
import LeaveManagement from './pages/LeaveManagement';
import Compliance from './pages/Compliance';
import Settings from './pages/Settings';
import Help from './pages/Help';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Notifications from './pages/Notifications';
import NotFound from './pages/NotFound';
import { ToastProvider } from './context/ToastContext';

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
            <Route path="compliance" element={<Compliance />} />
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
