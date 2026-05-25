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

import ForgotPassword from './pages/ForgotPassword';
import Notifications from './pages/Notifications';
import NotFound from './pages/NotFound';
import ShareDocument from './pages/ShareDocument';
// New pages
import Authorizations from './pages/Authorizations';
import Attestations from './pages/Attestations';
import Trainings from './pages/Trainings';
import Absences from './pages/Absences';
import Assignments from './pages/Assignments';
import Signature from './pages/Signature';
import Users from './pages/Users';
import CorrectionDossier from './pages/CorrectionDossier';

import { useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Protected Route Guard with full Role-Based Access Control (RBAC) validation
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, effectiveRole } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(effectiveRole)) {
    // Redirect unauthorized roles back to the main dashboard
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// Public Guest Route Guard to prevent logged-in users from visiting Login/Register pages
const GuestRoute = ({ children }) => {
  const { user } = useAuth();
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* Guest Auth Routes */}
          <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />

          <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
          
          {/* Public Verification Sharing Link */}
          <Route path="/requests/share/:docId" element={<ShareDocument />} />
          
          {/* Main Secure Layout Routes */}
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* Employee Management: Restricted from standard Employee role */}
            <Route path="employees" element={
              <ProtectedRoute allowedRoles={['HR_MANAGER', 'HR_AGENT', 'DEPARTMENT_MANAGER']}>
                <Employees />
              </ProtectedRoute>
            } />
            
            <Route path="requests" element={<Requests />} />
            <Route path="leave" element={<LeaveManagement />} />
            
            {/* Autorisations Exceptionnelles d'Absence - All roles */}
            <Route path="authorizations" element={<Authorizations />} />

            {/* Attestations & Bulletins de Paie - All roles + Secretary */}
            <Route path="attestations" element={<Attestations />} />

            {/* Gestion des Formations - All roles */}
            <Route path="trainings" element={<Trainings />} />

            {/* Correction Dossier Administratif - All roles */}
            <Route path="corrections" element={<CorrectionDossier />} />

            {/* Absences & Retards - HR and Managers */}
            <Route path="absences" element={
              <ProtectedRoute allowedRoles={['HR_MANAGER', 'HR_AGENT', 'DEPARTMENT_MANAGER']}>
                <Absences />
              </ProtectedRoute>
            } />

            {/* Affectations - HR only */}
            <Route path="assignments" element={
              <ProtectedRoute allowedRoles={['HR_MANAGER', 'HR_AGENT']}>
                <Assignments />
              </ProtectedRoute>
            } />

            {/* Signature Électronique - Secretary General only */}
            <Route path="signature" element={
              <ProtectedRoute allowedRoles={['SECRETARY_GENERAL']}>
                <Signature />
              </ProtectedRoute>
            } />

            {/* Calendar & Scheduling: Restricted to HR Managers and HR Agents */}
            <Route path="calendar" element={
              <ProtectedRoute allowedRoles={['HR_MANAGER', 'HR_AGENT']}>
                <Calendar />
              </ProtectedRoute>
            } />
            
            {/* Regulatory Compliance: Restricted to HR Managers and HR Agents */}
            <Route path="compliance" element={
              <ProtectedRoute allowedRoles={['HR_MANAGER', 'HR_AGENT']}>
                <Compliance />
              </ProtectedRoute>
            } />
            
            {/* Finance Panel: Restricted exclusively to HR Manager */}
            <Route path="finance" element={
              <ProtectedRoute allowedRoles={['HR_MANAGER']}>
                <Finance />
              </ProtectedRoute>
            } />
            
            <Route path="settings" element={
              <ProtectedRoute allowedRoles={['HR_MANAGER']}>
                <Settings />
              </ProtectedRoute>
            } />
            
            {/* System Users: Restricted exclusively to HR Manager */}
            <Route path="users" element={
              <ProtectedRoute allowedRoles={['HR_MANAGER']}>
                <Users />
              </ProtectedRoute>
            } />
            
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
