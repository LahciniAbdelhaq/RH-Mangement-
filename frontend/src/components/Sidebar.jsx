import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';

const Sidebar = ({ collapsed, setCollapsed }) => {
  const { user, effectiveRole, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();

  const isEmployee       = effectiveRole === 'EMPLOYEE';
  const isHRManager      = effectiveRole === 'HR_MANAGER';
  const isHRAgent        = effectiveRole === 'HR_AGENT';
  const isDeptManager    = effectiveRole === 'DEPARTMENT_MANAGER' || effectiveRole === 'INTERIM_MANAGER';
  const isSecretaryGen   = effectiveRole === 'SECRETARY_GENERAL';

  const canSeeEmployees   = isHRManager || isHRAgent || isDeptManager;
  const canSeeCompliance  = isHRManager || isHRAgent;
  const canSeeCalendar    = isHRManager || isHRAgent;
  const canSeeFinance     = isHRManager;
  const canSeeSettings    = isHRManager;
  const canSeeAssignments = isHRManager || isHRAgent;
  const canSeeAbsences    = isHRManager || isHRAgent || isDeptManager;
  const canSeeSignature   = isSecretaryGen;

  const roleLabel = {
    HR_MANAGER:        'Administrateur RH',
    HR_AGENT:          'Agent RH',
    DEPARTMENT_MANAGER:'Chef de Service',
    INTERIM_MANAGER:   'Chef de Service (Int.)',
    EMPLOYEE:          'Employé',
    SECRETARY_GENERAL: 'Secrétaire Générale',
  }[effectiveRole] || 'Collaborateur';

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
        {/* ── TABLEAU DE BORD ── */}
        <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <i className="fas fa-home"></i>
          <span className="nav-text">{t('sidebar.dashboard')}</span>
        </NavLink>

        {/* ── GESTION EMPLOYÉS ── */}
        {canSeeEmployees && (
          <NavLink to="/employees" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <i className="fas fa-users"></i>
            <span className="nav-text">{isHRManager || isHRAgent ? t('sidebar.employees') : t('sidebar.myTeam')}</span>
          </NavLink>
        )}

        {/* ── DEMANDES ── */}
        <NavLink to="/requests" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <i className="fas fa-file-signature"></i>
          <span className="nav-text">{isEmployee ? t('sidebar.myRequests') : t('sidebar.hrRequests')}</span>
        </NavLink>

        {/* ── CONGÉS & ABSENCES ── */}
        <NavLink to="/leave" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <i className="fas fa-calendar-alt"></i>
          <span className="nav-text">{isEmployee ? t('sidebar.myLeaves') : t('sidebar.leavesAndAbsences')}</span>
        </NavLink>

        {/* ── AUTORISATIONS D'ABSENCE ── */}
        <NavLink to="/authorizations" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <i className="fas fa-user-check"></i>
          <span className="nav-text">Autorisations</span>
        </NavLink>

        {/* ── ATTESTATIONS & BULLETINS ── */}
        <NavLink to="/attestations" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <i className="fas fa-file-contract"></i>
          <span className="nav-text">Attestations</span>
        </NavLink>

        {/* ── FORMATIONS ── */}
        <NavLink to="/trainings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <i className="fas fa-graduation-cap"></i>
          <span className="nav-text">Formations</span>
        </NavLink>

        {/* ── CORRECTION DOSSIER ── */}
        <NavLink to="/corrections" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <i className="fas fa-file-medical-alt"></i>
          <span className="nav-text">Correction Dossier</span>
        </NavLink>

        {/* ── ABSENCES & RETARDS (HR/Managers only) ── */}
        {canSeeAbsences && (
          <NavLink to="/absences" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <i className="fas fa-user-times"></i>
            <span className="nav-text">Absences & Retards</span>
          </NavLink>
        )}

        {/* ── AFFECTATIONS ── */}
        {canSeeAssignments && (
          <NavLink to="/assignments" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <i className="fas fa-sitemap"></i>
            <span className="nav-text">Affectations</span>
          </NavLink>
        )}

        {/* ── CALENDRIER ── */}
        {canSeeCalendar && (
          <NavLink to="/calendar" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <i className="fas fa-calendar-check"></i>
            <span className="nav-text">{t('sidebar.calendar')}</span>
          </NavLink>
        )}

        {/* ── CONFORMITÉ ── */}
        {canSeeCompliance && (
          <NavLink to="/compliance" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <i className="fas fa-shield-alt"></i>
            <span className="nav-text">{t('sidebar.compliance')}</span>
          </NavLink>
        )}

        {/* ── FINANCE ── */}
        {canSeeFinance && (
          <NavLink to="/finance" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <i className="fas fa-wallet"></i>
            <span className="nav-text">{t('sidebar.finance')}</span>
          </NavLink>
        )}

        {/* ── SIGNATURE ÉLECTRONIQUE (Secrétaire Générale only) ── */}
        {canSeeSignature && (
          <NavLink to="/signature" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <i className="fas fa-pen-fancy"></i>
            <span className="nav-text">Signature Électronique</span>
          </NavLink>
        )}

        <div className="nav-divider"></div>

        <NavLink to="/notifications" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <i className="fas fa-bell"></i>
          <span className="nav-text">{t('sidebar.notifications')}</span>
        </NavLink>

        {canSeeSettings && (
          <>
            <NavLink to="/users" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <i className="fas fa-users-cog"></i>
              <span className="nav-text">Utilisateurs</span>
            </NavLink>
            <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <i className="fas fa-cog"></i>
              <span className="nav-text">{t('sidebar.settings')}</span>
            </NavLink>
          </>
        )}

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
              <span className="sidebar-user-role">{roleLabel}</span>
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
