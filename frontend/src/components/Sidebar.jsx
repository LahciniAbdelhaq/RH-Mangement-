import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';

const Sidebar = ({ collapsed, setCollapsed }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();

  const canSeeEmployees = user?.role === 'HR_MANAGER' || user?.role === 'DEPARTMENT_MANAGER';
  const canSeeCompliance = user?.role === 'HR_MANAGER';
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">
          <img src="/logo.png" alt="HRConnect Logo" style={{ width: '100%', height: '100%', borderRadius: '8px' }} />
        </div>
        <div className="brand-text">
          <span className="brand-title">{t('sidebar.systemTitle')}</span>
          <span className="brand-subtitle">{t('sidebar.systemSubtitle')}</span>
        </div>
        <button className="toggle-sidebar-btn" onClick={() => setCollapsed(!collapsed)}>
          <i className={`fas fa-chevron-${collapsed ? 'right' : 'left'}`}></i>
        </button>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <i className="fas fa-home"></i>
          <span className="nav-text">{t('sidebar.dashboard')}</span>
          {user?.role === 'HR_MANAGER' && <span className="nav-badge gray">42</span>}
        </NavLink>

        {canSeeEmployees && (
          <NavLink to="/employees" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <i className="fas fa-users"></i>
            <span className="nav-text">{user?.role === 'HR_MANAGER' ? t('sidebar.employees') : t('sidebar.myTeam')}</span>
            <span className="nav-badge gray">452</span>
          </NavLink>
        )}

        <NavLink to="/requests" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <i className="fas fa-file-signature"></i>
          <span className="nav-text">{user?.role === 'EMPLOYEE' ? t('sidebar.myRequests') : t('sidebar.hrRequests')}</span>
        </NavLink>

        <NavLink to="/leave" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <i className="fas fa-calendar-alt"></i>
          <span className="nav-text">{user?.role === 'EMPLOYEE' ? t('sidebar.myLeaves') : t('sidebar.leavesAndAbsences')}</span>
          {user?.role !== 'EMPLOYEE' && <span className="nav-badge gray">12</span>}
        </NavLink>

        {canSeeCompliance && (
          <NavLink to="/compliance" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <i className="fas fa-shield-alt"></i>
            <span className="nav-text">{t('sidebar.compliance')}</span>
          </NavLink>
        )}

        <div className="nav-divider"></div>

        <NavLink to="/notifications" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <i className="fas fa-bell"></i>
          <span className="nav-text">{t('sidebar.notifications')}</span>
        </NavLink>

        <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <i className="fas fa-cog"></i>
          <span className="nav-text">{t('sidebar.settings')}</span>
        </NavLink>

        {/* Mobile-only theme & profile section */}
        <div className="mobile-only-nav">
          <div className="nav-divider"></div>
          
          <div className="nav-item" onClick={() => toggleTheme()} style={{ cursor: 'pointer' }}>
            <i className={theme === 'light' ? 'fas fa-moon' : 'fas fa-sun'}></i>
            <span className="nav-text">{theme === 'light' ? t('sidebar.darkMode') : t('sidebar.lightMode')}</span>
          </div>

          <div className="sidebar-user" style={{ borderTop: 'none', padding: '12px 16px' }}>
            <img src={user?.avatar} alt="User" />
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user?.name}</span>
              <span className="sidebar-user-role">{user?.role === 'HR_MANAGER' ? t('sidebar.hrDirector') : t('auth.employee')}</span>
            </div>
            <button className="logout-btn" onClick={() => logout()} title={t('sidebar.logout')}>
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
