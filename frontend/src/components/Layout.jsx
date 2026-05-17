import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Navigate, Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import Sidebar from './Sidebar';
import Chatbot from './Chatbot';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  
  const toggleLanguage = () => {
    const nextLang = i18n.language === 'fr' ? 'en' : 'fr';
    i18n.changeLanguage(nextLang);
  };
  const { user, logout } = useAuth();

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Nouvelle demande', message: 'Ali Benali a soumis une demande de congé.', time: 'Il y a 10 min', type: 'request', unread: true },
    { id: 2, title: 'Document expiré', message: 'Le contrat de Marc Leblanc expire bientôt.', time: 'Il y a 2h', type: 'alert', unread: true },
    { id: 3, title: 'Bienvenue', message: 'Bienvenue sur la plateforme RH Management.', time: 'Hier', type: 'info', unread: false },
  ]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <div className={`app-container ${collapsed ? 'sidebar-collapsed' : 'sidebar-open'}`}>
      <div className="sidebar-overlay" onClick={() => setCollapsed(true)}></div>
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <main className="main-content" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Top bar for global actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '70px', minHeight: '70px', padding: '0 24px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--main-bg)', zIndex: 10 }}>
          <button className="mobile-toggle" onClick={() => setCollapsed(false)}>
            <i className="fas fa-bars"></i>
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginLeft: 'auto' }}>
            {/* Notifications & Date */}
            <div className="header-actions" style={{ margin: 0 }}>
              <div 
                ref={notifRef}
                className="action-icon" 
                onClick={() => { setIsNotifOpen(!isNotifOpen); setIsProfileOpen(false); }}
                style={{ position: 'relative' }}
              >
                <i className={`far fa-bell ${isNotifOpen ? 'fas' : ''}`} style={{ color: isNotifOpen ? 'var(--primary)' : 'var(--text-gray)' }}></i>
                {unreadCount > 0 && <div className="indicator"></div>}

                {/* Notifications Dropdown */}
                {isNotifOpen && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 20px)', right: '-80px', width: '320px', backgroundColor: 'var(--main-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-dropdown)', zIndex: 100, overflow: 'hidden' }}>
                    <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{t('topbar.notifications')}</span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setNotifications(notifications.map(n => ({...n, unread: false}))); }}
                        style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        {t('topbar.markAllRead')}
                      </button>
                    </div>
                    <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                      {notifications.length > 0 ? (
                        notifications.map(notif => (
                          <div key={notif.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', backgroundColor: notif.unread ? 'var(--primary-bg)' : 'transparent', transition: 'background 0.2s', cursor: 'pointer' }}>
                            <div style={{ display: 'flex', gap: '12px' }}>
                              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: notif.type === 'alert' ? 'var(--danger)' : 'var(--primary)', marginTop: '6px', flexShrink: 0 }}></div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '2px' }}>{t(`dashboard.${notif.type === 'request' ? 'newRequest' : (notif.type === 'alert' ? 'stats.complianceRate' : 'welcome')}`)}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-gray)', lineHeight: '1.4' }}>{notif.message}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-light)', marginTop: '6px' }}>{notif.time}</div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-gray)', fontSize: '0.9rem' }}>
                          {t('topbar.noNotifications')}
                        </div>
                      )}
                    </div>
                    <Link 
                      to="/notifications" 
                      onClick={() => setIsNotifOpen(false)}
                      style={{ display: 'block', padding: '12px', textAlign: 'center', backgroundColor: 'var(--sidebar-bg)', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none', borderTop: '1px solid var(--border-color)' }}
                    >
                      {t('topbar.viewAllNotifications')}
                    </Link>
                  </div>
                )}
              </div>
              <div className="date-pill">
                <i className="far fa-calendar"></i>
                {new Date().toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>

            {/* Theme Toggle */}
            <button 
              className="hide-on-mobile"
              onClick={toggleTheme} 
              title={theme === 'light' ? t('sidebar.darkMode') : t('sidebar.lightMode')} 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', border: '1px solid var(--border-color)', background: 'var(--main-bg)', cursor: 'pointer', color: 'var(--text-gray)', transition: 'all 0.2s' }}
            >
              <i className={theme === 'light' ? 'fas fa-moon' : 'fas fa-sun'}></i>
            </button>

            {/* Language Toggle */}
            <button 
              className="hide-on-mobile"
              onClick={toggleLanguage} 
              title={t('topbar.switchLanguage')} 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '0 12px', height: '40px', borderRadius: '20px', border: '1px solid var(--border-color)', background: 'var(--main-bg)', cursor: 'pointer', color: 'var(--text-gray)', transition: 'all 0.2s', fontSize: '0.85rem', fontWeight: 600 }}
            >
              <i className="fas fa-globe"></i>
              <span>{i18n.language === 'fr' ? 'FR' : 'EN'}</span>
            </button>

            {/* Divider */}
            <div className="hide-on-mobile" style={{ width: '1px', height: '32px', backgroundColor: 'var(--border-color)', margin: '0 4px' }}></div>

            {/* User Profile with Dropdown */}
            <div className="hide-on-mobile" style={{ position: 'relative' }} ref={profileRef}>
              <div 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '4px 8px', borderRadius: '8px', transition: 'background-color 0.2s', backgroundColor: isProfileOpen ? 'var(--sidebar-bg)' : 'transparent' }}
              >
                 <img src={user.avatar} alt="User" style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid var(--primary-bg)', objectFit: 'cover' }} />
                 <div style={{ display: 'flex', flexDirection: 'column' }}>
                   <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-dark)', lineHeight: '1.2' }}>{user.name}</span>
                   <span style={{ fontSize: '0.75rem', color: 'var(--text-gray)' }}>{user.role === 'HR_MANAGER' ? t('auth.hrManager') : (user.role === 'EMPLOYEE' ? t('auth.employee') : t('auth.manager'))}</span>
                 </div>
                 <i className={`fas fa-chevron-${isProfileOpen ? 'up' : 'down'}`} style={{ fontSize: '0.8rem', color: 'var(--text-gray)', marginLeft: '4px' }}></i>
              </div>

              {/* Dropdown Menu */}
              {isProfileOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: '220px', backgroundColor: 'var(--main-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-card)', padding: '8px 0', zIndex: 100 }}>
                  <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
                    <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dark)' }}>{t('topbar.loggedInAs')}</span>
                    <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-gray)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{user.email}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                      <span className={`filter-tag ${user.role === 'HR_MANAGER' ? 'blue' : 'green'}`} style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 700 }}>
                        {user.role === 'HR_MANAGER' ? t('auth.hrManager') : t('auth.collaborator')}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem', color: '#10B981', fontWeight: 600 }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', display: 'inline-block', boxShadow: '0 0 8px #10B981' }}></span>
                        {t('topbar.online')}
                      </span>
                    </div>
                  </div>
                  
                  <Link to="/profile" onClick={() => setIsProfileOpen(false)} className="dropdown-item" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', color: 'var(--text-dark)', textDecoration: 'none', fontSize: '0.9rem', transition: 'background 0.2s' }}>
                    <i className="far fa-user" style={{ width: '16px', textAlign: 'center', color: 'var(--primary)' }}></i> {t('topbar.myProfile')}
                  </Link>
                  <Link to="/settings" state={{ tab: 'securite' }} onClick={() => setIsProfileOpen(false)} className="dropdown-item" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', color: 'var(--text-dark)', textDecoration: 'none', fontSize: '0.9rem', transition: 'background 0.2s' }}>
                    <i className="fas fa-shield-alt" style={{ width: '16px', textAlign: 'center', color: 'var(--c-purple)' }}></i> {t('topbar.security')}
                  </Link>
                  <Link to="/settings" state={{ tab: 'profil' }} onClick={() => setIsProfileOpen(false)} className="dropdown-item" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', color: 'var(--text-dark)', textDecoration: 'none', fontSize: '0.9rem', transition: 'background 0.2s' }}>
                    <i className="fas fa-cog" style={{ width: '16px', textAlign: 'center', color: 'var(--text-gray)' }}></i> {t('topbar.settings')}
                  </Link>
                  
                  <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '8px 0' }}></div>
                  
                  <Link to="/help" onClick={() => setIsProfileOpen(false)} className="dropdown-item" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', color: 'var(--text-dark)', textDecoration: 'none', fontSize: '0.9rem', transition: 'background 0.2s' }}>
                    <i className="far fa-question-circle" style={{ width: '16px', textAlign: 'center', color: 'var(--c-orange)' }}></i> {t('topbar.helpCenter')}
                  </Link>
                  
                  <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '8px 0' }}></div>
                  
                  <button onClick={() => { logout(); setIsProfileOpen(false); }} className="dropdown-item" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', color: '#EF4444', textDecoration: 'none', fontSize: '0.9rem', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.2s', fontFamily: 'inherit' }}>
                    <i className="fas fa-sign-out-alt" style={{ width: '16px', textAlign: 'center' }}></i> {t('topbar.logout')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          <Outlet />
        </div>
      </main>
      {user?.role === 'HR_MANAGER' && <Chatbot />}
    </div>
  );
}
