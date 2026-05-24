import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { User, Mail, Phone, MapPin, Clock, Calendar, Briefcase, Shield, Globe, Users, Bell, AlertTriangle, Lock, Key, Eye, EyeOff, Loader2, Check, Link2 } from 'lucide-react';
import { logSystemActivity } from '../utils/rbac';

import { MOROCCAN_CITIES } from '../utils/cities';

const Settings = () => {
  const { showToast } = useToast();
  const location = useLocation();
  const { user, setUser } = useAuth();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'profil');
  const [auditLogs, setAuditLogs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 5;
  
  useEffect(() => {
    if (activeTab === 'audit') {
      const logs = JSON.parse(localStorage.getItem('system_audit_logs')) || [];
      setAuditLogs(logs);
      setCurrentPage(1); // Reset to page 1 when loading logs
    }
  }, [activeTab]);

  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = auditLogs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(auditLogs.length / logsPerPage);

  const clearAuditLogs = () => {
    localStorage.removeItem('system_audit_logs');
    setAuditLogs([]);
    showToast("Journal d'audit réinitialisé avec succès.", "success");
    logSystemActivity("Nettoyage des logs", user?.name, "Effacement de l'ensemble du journal d'audit");
  };

  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('hr_profile_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {
      prenom: user?.name?.split(' ')[0] || 'Sarah',
      nom: user?.name?.split(' ')[1] || 'Connor',
      email: user?.email || 'sarah.connor@entreprise.com',
      phone: '+212 6 12 34 56 78',
      location: 'Casablanca, Maroc',
      contractType: 'CDI (Temps Plein)',
      hireDate: '2024-01-12',
      department: 'Ressources Humaines',
    };
  });

  const handleSave = () => {
    localStorage.setItem('hr_profile_data', JSON.stringify(formData));
    if (setUser && user) {
      setUser({
        ...user,
        name: `${formData.prenom} ${formData.nom}`,
        email: formData.email
      });
    }
    showToast(t('settings.toast.saveSuccess') || 'Modifications enregistrées !', 'success');
  };

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [slackConnected, setSlackConnected] = useState(true);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [slackLoading, setSlackLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const toggleSlack = () => {
    setSlackLoading(true);
    setTimeout(() => {
      const nextState = !slackConnected;
      setSlackConnected(nextState);
      setSlackLoading(false);
      showToast(
        nextState 
          ? (t('settings.toast.slackConnected') || 'Slack connecté avec succès !')
          : (t('settings.toast.slackDisconnected') || 'Slack déconnecté !'),
        'success'
      );
    }, 1000);
  };

  const toggleGoogle = () => {
    setGoogleLoading(true);
    setTimeout(() => {
      const nextState = !googleConnected;
      setGoogleConnected(nextState);
      setGoogleLoading(false);
      showToast(
        nextState 
          ? (t('settings.toast.googleConnected') || 'Google Workspace connecté !')
          : (t('settings.toast.googleDisconnected') || 'Google Workspace déconnecté !'),
        'success'
      );
    }, 1000);
  };

  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');

  const filteredCities = MOROCCAN_CITIES.filter(city => 
    city.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(
      locationSearch.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    )
  );

  const inputStyle = {
    width: '100%',
    padding: '12px 16px 12px 44px',
    fontSize: '14px',
    fontWeight: 500,
    borderRadius: '10px',
    border: `1.5px solid ${isDark ? '#334155' : '#e2e8f0'}`,
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
    color: isDark ? '#f1f5f9' : '#0f172a',
    outline: 'none',
    transition: 'border-color .15s, box-shadow .15s, background-color .15s',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  };

  const onFocus = (e) => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,.12)'; };
  const onBlur  = (e) => { e.target.style.borderColor = isDark ? '#334155' : '#e2e8f0'; e.target.style.boxShadow = 'none'; };

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state]);

  return (
    <>
      <header className="header">
        <div className="header-title">
          <h1>{t('settings.title')}</h1>
          <p>{t('settings.subtitle')}</p>
        </div>
        <div className="header-actions">
          <button className="action-btn primary" onClick={handleSave}>
            <i className="fas fa-save"></i> {t('settings.saveAllBtn')}
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
        {/* Settings Menu */}
        <div style={{ width: '240px', display: 'flex', flexDirection: 'column' }}>
          <button className={`settings-nav-item ${activeTab === 'profil' ? 'active' : ''}`} onClick={() => setActiveTab('profil')}>
            <i className="far fa-user-circle"></i> <span>{t('settings.tabs.editProfile')}</span>
          </button>
          <button className={`settings-nav-item ${activeTab === 'organisation' ? 'active' : ''}`} onClick={() => setActiveTab('organisation')}>
            <i className="far fa-building"></i> <span>{t('settings.tabs.organisation')}</span>
          </button>
          <button className={`settings-nav-item ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>
            <i className="far fa-bell"></i> <span>{t('settings.tabs.notifications')}</span>
          </button>
          <button className={`settings-nav-item ${activeTab === 'securite' ? 'active' : ''}`} onClick={() => setActiveTab('securite')}>
            <i className="fas fa-shield-alt"></i> <span>{t('settings.tabs.security')}</span>
          </button>
          <button className={`settings-nav-item ${activeTab === 'integrations' ? 'active' : ''}`} onClick={() => setActiveTab('integrations')}>
            <i className="fas fa-plug"></i> <span>{t('settings.tabs.integrations')}</span>
          </button>
          <button className={`settings-nav-item ${activeTab === 'audit' ? 'active' : ''}`} onClick={() => setActiveTab('audit')}>
            <i className="fas fa-history"></i> <span>Journal d'Audit</span>
          </button>
        </div>

        {/* Settings Content Container */}
        <div className="card" style={{ flex: 1 }}>
          
          {/* Pane: Profil */}
          {activeTab === 'profil' && (
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>{t('settings.tabs.editProfile')}</h3>
              
              <div style={{ display: 'flex', gap: '24px', marginBottom: '16px' }}>
                <img src={user?.avatar || "https://ui-avatars.com/api/?name=Sarah+Connor&background=2563EB&color=fff&size=128"} alt="Profile" style={{ width: '80px', height: '80px', borderRadius: '50%' }} />
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="action-btn">{t('settings.profile.uploadPhoto')}</button>
                    <button className="action-btn" style={{ color: 'var(--danger)' }}>{t('settings.profile.delete')}</button>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-gray)' }}>{t('settings.profile.photoLimits')}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: isDark ? '#cbd5e1' : '#374151', marginBottom: 8 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '6px', background: 'rgba(37,99,235,.1)', color: '#2563eb' }}><User style={{ width: 12, height: 12 }} /></span>
                    {t('settings.profile.firstName')}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: '#2563eb', zIndex: 5 }} />
                    <input 
                      type="text" 
                      value={formData.prenom} 
                      onChange={(e) => setFormData({ ...formData, prenom: e.target.value })} 
                      style={inputStyle} 
                      onFocus={onFocus}
                      onBlur={onBlur}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: isDark ? '#cbd5e1' : '#374151', marginBottom: 8 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '6px', background: 'rgba(37,99,235,.1)', color: '#2563eb' }}><User style={{ width: 12, height: 12 }} /></span>
                    {t('settings.profile.lastName')}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: '#2563eb', zIndex: 5 }} />
                    <input 
                      type="text" 
                      value={formData.nom} 
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })} 
                      style={inputStyle} 
                      onFocus={onFocus}
                      onBlur={onBlur}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: isDark ? '#cbd5e1' : '#374151', marginBottom: 8 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '6px', background: 'rgba(37,99,235,.1)', color: '#2563eb' }}><Mail style={{ width: 12, height: 12 }} /></span>
                    {t('settings.profile.email')}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: '#2563eb', zIndex: 5 }} />
                    <input 
                      type="email" 
                      value={formData.email} 
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                      style={inputStyle} 
                      onFocus={onFocus}
                      onBlur={onBlur}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: isDark ? '#cbd5e1' : '#374151', marginBottom: 8 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '6px', background: 'rgba(16,185,129,.1)', color: '#10b981' }}><Shield style={{ width: 12, height: 12 }} /></span>
                    {t('settings.profile.role')}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Shield style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: '#10b981', zIndex: 5 }} />
                    <input 
                      type="text" 
                      defaultValue={user?.role === 'HR_MANAGER' ? t('profile.mockHRRole') : t('profile.mockEngRole')} 
                      disabled 
                      style={{ ...inputStyle, background: isDark ? '#1e293b' : '#f8fafc', color: 'var(--text-gray)', cursor: 'not-allowed' }} 
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: isDark ? '#cbd5e1' : '#374151', marginBottom: 8 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '6px', background: 'rgba(239,68,68,.1)', color: '#ef4444' }}><Phone style={{ width: 12, height: 12 }} /></span>
                    {t('settings.profile.phone')}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Phone style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: '#ef4444', zIndex: 5 }} />
                    <input 
                      type="text" 
                      value={formData.phone} 
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                      style={inputStyle} 
                      onFocus={onFocus}
                      onBlur={onBlur}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: isDark ? '#cbd5e1' : '#374151', marginBottom: 8 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '6px', background: 'rgba(107,114,128,.1)', color: '#6b7280' }}><MapPin style={{ width: 12, height: 12 }} /></span>
                    {t('settings.profile.location')}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <MapPin style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: '#6b7280', zIndex: 10 }} />
                    <button 
                      type="button"
                      onClick={() => {
                        setShowLocationDropdown(!showLocationDropdown);
                        setLocationSearch('');
                      }}
                      style={{ 
                        ...inputStyle, 
                        textAlign: 'left', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        paddingRight: '36px',
                        userSelect: 'none'
                      }}
                    >
                      <span>{formData.location}</span>
                      <i className="fas fa-chevron-down" style={{ color: '#6b7280', pointerEvents: 'none' }}></i>
                    </button>

                    {showLocationDropdown && (
                      <>
                        {/* Dismiss Overlay */}
                        <div 
                          onClick={() => setShowLocationDropdown(false)} 
                          style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'transparent' }} 
                        />
                        {/* Searchable dropdown container */}
                        <div 
                          style={{ 
                            position: 'absolute', 
                            top: '100%', 
                            left: 0, 
                            right: 0, 
                            marginTop: '6px', 
                            background: isDark ? '#1e293b' : '#ffffff', 
                            border: `1.5px solid ${isDark ? '#334155' : '#e2e8f0'}`, 
                            borderRadius: '12px', 
                            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)', 
                            zIndex: 9999,
                            maxHeight: '260px',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden'
                          }}
                        >
                          {/* Search Input Box */}
                          <div style={{ padding: '8px', borderBottom: `1.5px solid ${isDark ? '#334155' : '#e2e8f0'}`, background: isDark ? '#1e293b' : '#ffffff' }}>
                            <input 
                              type="text"
                              placeholder="Rechercher une ville..."
                              value={locationSearch}
                              onChange={(e) => setLocationSearch(e.target.value)}
                              autoFocus
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                fontSize: '13px',
                                borderRadius: '8px',
                                border: `1.5px solid ${isDark ? '#475569' : '#cbd5e1'}`,
                                backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                                color: isDark ? '#f1f5f9' : '#0f172a',
                                outline: 'none',
                                boxSizing: 'border-box'
                              }}
                            />
                          </div>

                          {/* Cities Scroll List */}
                          <div style={{ overflowY: 'auto', flex: 1, padding: '4px' }}>
                            {filteredCities.length > 0 ? (
                              filteredCities.map((city) => {
                                const fullCityStr = `${city}, Maroc`;
                                const isSelected = formData.location === fullCityStr;
                                return (
                                  <div 
                                    key={city}
                                    onClick={() => {
                                      setFormData({ ...formData, location: fullCityStr });
                                      setShowLocationDropdown(false);
                                    }}
                                    style={{
                                      padding: '10px 14px',
                                      fontSize: '13px',
                                      fontWeight: 500,
                                      borderRadius: '8px',
                                      color: isSelected ? '#ffffff' : (isDark ? '#cbd5e1' : '#334155'),
                                      background: isSelected ? '#2563eb' : 'transparent',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      transition: 'all 0.15s'
                                    }}
                                    onMouseEnter={(e) => {
                                      if (!isSelected) {
                                        e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(37,99,235,0.05)';
                                        e.currentTarget.style.color = isDark ? '#ffffff' : '#2563eb';
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (!isSelected) {
                                        e.currentTarget.style.background = 'transparent';
                                        e.currentTarget.style.color = isDark ? '#cbd5e1' : '#334155';
                                      }
                                    }}
                                  >
                                    <span>{fullCityStr}</span>
                                    {isSelected && <Check style={{ width: 14, height: 14 }} />}
                                  </div>
                                );
                              })
                            ) : (
                              <div style={{ padding: '16px', fontSize: '13px', color: 'var(--text-gray)', textAlign: 'center' }}>
                                Aucune ville trouvée
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: isDark ? '#cbd5e1' : '#374151', marginBottom: 8 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '6px', background: 'rgba(245,158,11,.1)', color: '#f59e0b' }}><Clock style={{ width: 12, height: 12 }} /></span>
                    {t('settings.profile.contractType')}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Clock style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: '#f59e0b', zIndex: 5 }} />
                    <select 
                      value={formData.contractType} 
                      onChange={(e) => setFormData({ ...formData, contractType: e.target.value })} 
                      style={{ ...inputStyle, paddingRight: '36px', appearance: 'none', WebkitAppearance: 'none' }} 
                      onFocus={onFocus}
                      onBlur={onBlur}
                    >
                      <option value="CDI (Temps Plein)">CDI (Temps Plein)</option>
                      <option value="CDD (Temps Plein)">CDD (Temps Plein)</option>
                      <option value="Anapec (Contrat d'insertion)">Contrat Anapec</option>
                      <option value="Stage (PFE)">Stage PFE</option>
                      <option value="Freelance">Freelance</option>
                    </select>
                    <i className="fas fa-chevron-down" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#f59e0b', pointerEvents: 'none' }}></i>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: isDark ? '#cbd5e1' : '#374151', marginBottom: 8 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '6px', background: 'rgba(16,185,129,.1)', color: '#10b981' }}><Calendar style={{ width: 12, height: 12 }} /></span>
                    {t('settings.profile.hireDate')}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Calendar style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: '#10b981', zIndex: 5 }} />
                    <input 
                      type="date" 
                      value={formData.hireDate} 
                      onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })} 
                      style={inputStyle} 
                      onFocus={onFocus}
                      onBlur={onBlur}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: isDark ? '#cbd5e1' : '#374151', marginBottom: 8 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '6px', background: 'rgba(147,51,234,.1)', color: '#9333ea' }}><Briefcase style={{ width: 12, height: 12 }} /></span>
                    {t('settings.profile.department')}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Briefcase style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: '#9333ea', zIndex: 5 }} />
                    <select 
                      value={formData.department} 
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })} 
                      style={{ ...inputStyle, paddingRight: '36px', appearance: 'none', WebkitAppearance: 'none' }} 
                      onFocus={onFocus}
                      onBlur={onBlur}
                    >
                      <option value="Ressources Humaines">Ressources Humaines</option>
                      <option value="Ingénierie">Ingénierie</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Finance">Finance</option>
                      <option value="Support Client">Support Client</option>
                    </select>
                    <i className="fas fa-chevron-down" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#9333ea', pointerEvents: 'none' }}></i>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pane: Organisation */}
          {activeTab === 'organisation' && (
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>{t('settings.organisationTab.title')}</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: isDark ? '#cbd5e1' : '#374151', marginBottom: 8 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '6px', background: 'rgba(37,99,235,.1)', color: '#2563eb' }}><Briefcase style={{ width: 12, height: 12 }} /></span>
                    {t('settings.organisationTab.companyName')}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Briefcase style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: '#2563eb', zIndex: 5 }} />
                    <input 
                      type="text" 
                      defaultValue="Acme Corp" 
                      style={inputStyle} 
                      onFocus={onFocus}
                      onBlur={onBlur}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: isDark ? '#cbd5e1' : '#374151', marginBottom: 8 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '6px', background: 'rgba(147,51,234,.1)', color: '#9333ea' }}><Globe style={{ width: 12, height: 12 }} /></span>
                    {t('settings.organisationTab.industry')}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Globe style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: '#9333ea', zIndex: 5 }} />
                    <input 
                      type="text" 
                      defaultValue="Technologies" 
                      style={inputStyle} 
                      onFocus={onFocus}
                      onBlur={onBlur}
                    />
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: isDark ? '#cbd5e1' : '#374151', marginBottom: 8 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '6px', background: 'rgba(16,185,129,.1)', color: '#10b981' }}><Users style={{ width: 12, height: 12 }} /></span>
                  {t('settings.organisationTab.companySize')}
                </label>
                <div style={{ position: 'relative' }}>
                  <Users style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: '#10b981', zIndex: 5 }} />
                  <select 
                    defaultValue="201-500 employés" 
                    style={{ ...inputStyle, paddingRight: '36px', appearance: 'none', WebkitAppearance: 'none' }}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  >
                    <option value="1-50 employés">1-50 {t('sidebar.employees').toLowerCase()}</option>
                    <option value="51-200 employés">51-200 {t('sidebar.employees').toLowerCase()}</option>
                    <option value="201-500 employés">201-500 {t('sidebar.employees').toLowerCase()}</option>
                    <option value="500+ employés">500+ {t('sidebar.employees').toLowerCase()}</option>
                  </select>
                  <i className="fas fa-chevron-down" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#10b981', pointerEvents: 'none' }}></i>
                </div>
              </div>
            </div>
          )}

          {/* Pane: Notifications */}
          {activeTab === 'notifications' && (
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>{t('settings.notificationsTab.title')}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', border: `1.5px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: '12px', background: isDark ? '#1e293b' : '#ffffff', transition: 'all 0.2s' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '8px', background: 'rgba(37,99,235,.1)', color: '#2563eb' }}>
                    <Mail style={{ width: 18, height: 18 }} />
                  </span>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.95rem', fontWeight: 500, cursor: 'pointer', flex: 1, margin: 0, color: isDark ? '#cbd5e1' : '#374151' }}>
                    <input type="checkbox" defaultChecked style={{ accentColor: '#2563eb', width: '18px', height: '18px', cursor: 'pointer' }} />
                    {t('settings.notificationsTab.weeklySummary')}
                  </label>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', border: `1.5px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: '12px', background: isDark ? '#1e293b' : '#ffffff', transition: 'all 0.2s' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '8px', background: 'rgba(245,158,11,.1)', color: '#f59e0b' }}>
                    <Bell style={{ width: 18, height: 18 }} />
                  </span>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.95rem', fontWeight: 500, cursor: 'pointer', flex: 1, margin: 0, color: isDark ? '#cbd5e1' : '#374151' }}>
                    <input type="checkbox" defaultChecked style={{ accentColor: '#f59e0b', width: '18px', height: '18px', cursor: 'pointer' }} />
                    {t('settings.notificationsTab.employeeRequests')}
                  </label>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', border: `1.5px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: '12px', background: isDark ? '#1e293b' : '#ffffff', transition: 'all 0.2s' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '8px', background: 'rgba(239,68,68,.1)', color: '#ef4444' }}>
                    <AlertTriangle style={{ width: 18, height: 18 }} />
                  </span>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.95rem', fontWeight: 500, cursor: 'pointer', flex: 1, margin: 0, color: isDark ? '#cbd5e1' : '#374151' }}>
                    <input type="checkbox" style={{ accentColor: '#ef4444', width: '18px', height: '18px', cursor: 'pointer' }} />
                    {t('settings.notificationsTab.complianceAlerts')}
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Pane: Sécurité */}
          {activeTab === 'securite' && (
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>{t('settings.securityTab.title')}</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: isDark ? '#cbd5e1' : '#374151', marginBottom: 8 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '6px', background: 'rgba(239,68,68,.1)', color: '#ef4444' }}><Lock style={{ width: 12, height: 12 }} /></span>
                    {t('settings.securityTab.currentPassword')}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: '#ef4444', zIndex: 5 }} />
                    <input 
                      type={showCurrentPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      style={{ ...inputStyle, paddingRight: '44px' }} 
                      onFocus={onFocus}
                      onBlur={onBlur}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, color: 'var(--text-gray)', zIndex: 5 }}
                    >
                      {showCurrentPassword ? <EyeOff style={{ width: 18, height: 18 }} /> : <Eye style={{ width: 18, height: 18 }} />}
                    </button>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: isDark ? '#cbd5e1' : '#374151', marginBottom: 8 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '6px', background: 'rgba(245,158,11,.1)', color: '#f59e0b' }}><Key style={{ width: 12, height: 12 }} /></span>
                      {t('settings.securityTab.newPassword')}
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Key style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: '#f59e0b', zIndex: 5 }} />
                      <input 
                        type={showNewPassword ? "text" : "password"} 
                        style={{ ...inputStyle, paddingRight: '44px' }} 
                        onFocus={onFocus}
                        onBlur={onBlur}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, color: 'var(--text-gray)', zIndex: 5 }}
                      >
                        {showNewPassword ? <EyeOff style={{ width: 18, height: 18 }} /> : <Eye style={{ width: 18, height: 18 }} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: isDark ? '#cbd5e1' : '#374151', marginBottom: 8 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '6px', background: 'rgba(16,185,129,.1)', color: '#10b981' }}><Key style={{ width: 12, height: 12 }} /></span>
                      {t('settings.securityTab.confirmPassword')}
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Key style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: '#10b981', zIndex: 5 }} />
                      <input 
                        type={showConfirmPassword ? "text" : "password"} 
                        style={{ ...inputStyle, paddingRight: '44px' }} 
                        onFocus={onFocus}
                        onBlur={onBlur}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, color: 'var(--text-gray)', zIndex: 5 }}
                      >
                        {showConfirmPassword ? <EyeOff style={{ width: 18, height: 18 }} /> : <Eye style={{ width: 18, height: 18 }} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <button className="action-btn primary" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => showToast(t('settings.toast.passwordSuccess') || 'Mot de passe mis à jour !', 'success')}>
                <Key style={{ width: 16, height: 16 }} /> {t('settings.securityTab.updateBtn')}
              </button>
              
              <h4 style={{ fontSize: '1rem', marginBottom: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: '6px', background: 'rgba(245,158,11,.1)', color: '#f59e0b' }}><Shield style={{ width: 14, height: 14 }} /></span>
                {t('settings.securityTab.twoFactor')}
              </h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: `1.5px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: '12px', background: isDark ? '#1e293b' : '#ffffff' }}>
                <div>
                  <div style={{ fontWeight: 600, color: isDark ? '#f1f5f9' : '#0f172a' }}>{t('settings.securityTab.secureAccount')}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-gray)', marginTop: '4px' }}>{t('settings.securityTab.secureAccountDesc')}</div>
                </div>
                <button className="action-btn" style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>{t('settings.securityTab.enableBtn')}</button>
              </div>
            </div>
          )}

          {/* Pane: Intégrations */}
          {activeTab === 'integrations' && (
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>{t('settings.integrationsTab.title')}</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Slack Card */}
                <div 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '20px', 
                    border: slackConnected ? '1.5px solid rgba(224, 30, 90, 0.3)' : `1.5px solid ${isDark ? '#334155' : '#e2e8f0'}`, 
                    borderRadius: '16px', 
                    background: slackConnected 
                      ? (isDark ? 'linear-gradient(135deg, #1e293b, rgba(224, 30, 90, 0.04))' : 'linear-gradient(135deg, #ffffff, rgba(224, 30, 90, 0.02))')
                      : (isDark ? '#1e293b' : '#ffffff'),
                    boxShadow: slackConnected ? '0 10px 25px -5px rgba(224, 30, 90, 0.08)' : 'var(--shadow-card)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        width: 52, 
                        height: 52, 
                        borderRadius: '12px', 
                        background: isDark ? '#0f172a' : '#f8fafc', 
                        border: `1.5px solid ${slackConnected ? 'rgba(224, 30, 90, 0.2)' : (isDark ? '#334155' : '#e2e8f0')}`,
                        boxShadow: slackConnected ? '0 0 12px rgba(224, 30, 90, 0.15)' : 'none',
                        transition: 'all 0.3s'
                      }}
                    >
                      <i className="fab fa-slack" style={{ fontSize: '26px', color: '#E01E5A' }}></i>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: isDark ? '#f1f5f9' : '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Slack
                        {slackConnected && (
                          <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(16,185,129,0.1)', color: '#10b981', fontWeight: 700, textTransform: 'uppercase' }}>
                            {t('settings.integrationsTab.connected')}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-gray)', marginTop: '4px' }}>{t('settings.integrationsTab.slackDesc')}</div>
                    </div>
                  </div>
                  <button 
                    className={`action-btn ${slackConnected ? '' : 'primary'}`}
                    disabled={slackLoading}
                    onClick={toggleSlack}
                    style={{
                      minWidth: '120px',
                      color: slackConnected ? '#ef4444' : '#ffffff',
                      borderColor: slackConnected ? '#ef4444' : '#2563eb',
                      background: slackConnected ? 'rgba(239, 68, 68, 0.05)' : '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '10px 18px',
                      borderRadius: '10px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: slackConnected ? 'none' : '0 4px 12px rgba(37,99,235,0.2)',
                      transition: 'all 0.2s',
                      border: '1.5px solid'
                    }}
                  >
                    {slackLoading ? (
                      <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
                    ) : slackConnected ? (
                      <>{t('settings.integrationsTab.disconnectBtn')}</>
                    ) : (
                      <><Link2 style={{ width: 16, height: 16 }} /> {t('settings.integrationsTab.connectBtn')}</>
                    )}
                  </button>
                </div>

                {/* Google Workspace Card */}
                <div 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '20px', 
                    border: googleConnected ? '1.5px solid rgba(66, 133, 244, 0.3)' : `1.5px solid ${isDark ? '#334155' : '#e2e8f0'}`, 
                    borderRadius: '16px', 
                    background: googleConnected 
                      ? (isDark ? 'linear-gradient(135deg, #1e293b, rgba(66, 133, 244, 0.04))' : 'linear-gradient(135deg, #ffffff, rgba(66, 133, 244, 0.02))')
                      : (isDark ? '#1e293b' : '#ffffff'),
                    boxShadow: googleConnected ? '0 10px 25px -5px rgba(66, 133, 244, 0.08)' : 'var(--shadow-card)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        width: 52, 
                        height: 52, 
                        borderRadius: '12px', 
                        background: isDark ? '#0f172a' : '#f8fafc', 
                        border: `1.5px solid ${googleConnected ? 'rgba(66, 133, 244, 0.2)' : (isDark ? '#334155' : '#e2e8f0')}`,
                        boxShadow: googleConnected ? '0 0 12px rgba(66, 133, 244, 0.15)' : 'none',
                        transition: 'all 0.3s'
                      }}
                    >
                      <i className="fab fa-google" style={{ fontSize: '22px', color: '#4285F4' }}></i>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: isDark ? '#f1f5f9' : '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Google Workspace
                        {googleConnected && (
                          <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(16,185,129,0.1)', color: '#10b981', fontWeight: 700, textTransform: 'uppercase' }}>
                            {t('settings.integrationsTab.connected')}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-gray)', marginTop: '4px' }}>{t('settings.integrationsTab.googleDesc')}</div>
                    </div>
                  </div>
                  <button 
                    className={`action-btn ${googleConnected ? '' : 'primary'}`}
                    disabled={googleLoading}
                    onClick={toggleGoogle}
                    style={{
                      minWidth: '120px',
                      color: googleConnected ? '#ef4444' : '#ffffff',
                      borderColor: googleConnected ? '#ef4444' : '#2563eb',
                      background: googleConnected ? 'rgba(239, 68, 68, 0.05)' : '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '10px 18px',
                      borderRadius: '10px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: googleConnected ? 'none' : '0 4px 12px rgba(37,99,235,0.2)',
                      transition: 'all 0.2s',
                      border: '1.5px solid'
                    }}
                  >
                    {googleLoading ? (
                      <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
                    ) : googleConnected ? (
                      <>{t('settings.integrationsTab.disconnectBtn')}</>
                    ) : (
                      <><Link2 style={{ width: 16, height: 16 }} /> {t('settings.integrationsTab.connectBtn')}</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Pane: Audit Logs */}
          {activeTab === 'audit' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <h3 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 700 }}>Journal d'Audit de Sécurité</h3>
                <button className="action-btn" style={{ borderColor: 'var(--danger)', color: 'var(--danger)', background: 'transparent' }} onClick={clearAuditLogs}>
                  <i className="fas fa-trash-alt"></i> Vider l'historique
                </button>
              </div>
              
              <p style={{ fontSize: '0.85rem', color: 'var(--text-gray)', marginBottom: '20px' }}>
                Ce journal contient l'historique complet des actions d'administration, de modification de profils, de processus de validation de demandes et d'activités d'authentification effectuées sur la plateforme.
              </p>
              
              <div className="table-responsive" style={{ overflow: 'hidden', borderRadius: '8px', border: `1.5px solid ${isDark ? '#334155' : '#e2e8f0'}` }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead style={{ background: isDark ? '#1e293b' : '#f8fafc', borderBottom: `1.5px solid ${isDark ? '#334155' : '#e2e8f0'}` }}>
                    <tr>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: isDark ? '#cbd5e1' : '#475569' }}>Date & Heure</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: isDark ? '#cbd5e1' : '#475569' }}>Activité</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: isDark ? '#cbd5e1' : '#475569' }}>Auteur</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: isDark ? '#cbd5e1' : '#475569' }}>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentLogs.map((log) => {
                      let badgeColor = '#3b82f6';
                      let badgeBg = 'rgba(59, 130, 246, 0.1)';
                      if (log.action.includes('Suppression') || log.action.includes('Nettoyage')) {
                        badgeColor = '#ef4444';
                        badgeBg = 'rgba(239, 68, 68, 0.1)';
                      } else if (log.action.includes('Création') || log.action.includes('Approbation') || log.action.includes('Validation') || log.action.includes('Génération')) {
                        badgeColor = '#10b981';
                        badgeBg = 'rgba(16, 185, 129, 0.1)';
                      } else if (log.action.includes('Modification') || log.action.includes('Transfert')) {
                        badgeColor = '#f59e0b';
                        badgeBg = 'rgba(245, 158, 11, 0.1)';
                      }
                      
                      return (
                        <tr key={log.id} style={{ borderBottom: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, background: isDark ? '#1e293b' : '#ffffff' }}>
                          <td style={{ padding: '12px 16px', whiteSpace: 'nowrap', color: 'var(--text-gray)' }}>
                            {new Date(log.timestamp).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'medium' })}
                          </td>
                          <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                            <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, color: badgeColor, background: badgeBg }}>
                              {log.action}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: 600, color: isDark ? '#f1f5f9' : '#1e293b' }}>
                            {log.user}
                          </td>
                          <td style={{ padding: '12px 16px', color: isDark ? '#94a3b8' : '#64748b', lineHeight: 1.4 }}>
                            {log.details}
                          </td>
                        </tr>
                      );
                    })}
                    {auditLogs.length === 0 && (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-gray)' }}>
                          Aucune activité enregistrée pour le moment.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {auditLogs.length > logsPerPage && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', padding: '12px', background: isDark ? '#1e293b' : '#f8fafc', borderRadius: '8px', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}` }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-gray)', fontWeight: 500 }}>
                    Affichage de <span style={{ color: 'var(--text-dark)', fontWeight: 700 }}>{indexOfFirstLog + 1}</span> à <span style={{ color: 'var(--text-dark)', fontWeight: 700 }}>{Math.min(indexOfLastLog, auditLogs.length)}</span> sur <span style={{ color: 'var(--text-dark)', fontWeight: 700 }}>{auditLogs.length}</span> entrées
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button 
                      style={{ 
                        padding: '6px 12px', 
                        fontSize: '0.8rem', 
                        borderRadius: '6px', 
                        border: `1px solid ${isDark ? '#475569' : '#cbd5e1'}`, 
                        background: isDark ? '#334155' : '#ffffff', 
                        color: currentPage === 1 ? 'var(--text-gray)' : 'var(--text-dark)',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        fontWeight: 600,
                        transition: 'all 0.2s'
                      }}
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Précédent
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        style={{ 
                          padding: '6px 12px', 
                          fontSize: '0.8rem', 
                          borderRadius: '6px', 
                          border: currentPage === page ? '1px solid var(--primary)' : `1px solid ${isDark ? '#475569' : '#cbd5e1'}`, 
                          background: currentPage === page ? 'var(--primary)' : (isDark ? '#334155' : '#ffffff'), 
                          color: currentPage === page ? '#ffffff' : 'var(--text-dark)',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          boxShadow: currentPage === page ? '0 2px 4px rgba(37, 99, 236, 0.2)' : 'none'
                        }}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    ))}
                    <button 
                      style={{ 
                        padding: '6px 12px', 
                        fontSize: '0.8rem', 
                        borderRadius: '6px', 
                        border: `1px solid ${isDark ? '#475569' : '#cbd5e1'}`, 
                        background: isDark ? '#334155' : '#ffffff', 
                        color: currentPage === totalPages ? 'var(--text-gray)' : 'var(--text-dark)',
                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                        fontWeight: 600,
                        transition: 'all 0.2s'
                      }}
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default Settings;
