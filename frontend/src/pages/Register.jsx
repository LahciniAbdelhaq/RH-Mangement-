import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import {
  User, Mail, Lock, ArrowRight, Loader2,
  Sun, Moon, AlertCircle, Shield, Zap, Users
} from 'lucide-react';

const Register = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate               = useNavigate();
  const { t }                  = useTranslation();

  const [formData, setFormData] = useState({ prenom: '', nom: '', email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]       = useState('');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleRegister = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => navigate('/dashboard'), 1500);
  };

  const isDark = theme === 'dark';

  const inputStyle = {
    width: '100%',
    padding: '13px 16px',
    fontSize: '14px',
    fontWeight: 500,
    borderRadius: '10px',
    border: `1.5px solid ${isDark ? '#334155' : '#e2e8f0'}`,
    backgroundColor: isDark ? '#1e293b' : '#f8fafc',
    color: isDark ? '#f1f5f9' : '#0f172a',
    outline: 'none',
    transition: 'border-color .15s, box-shadow .15s',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  };

  const onFocus = (e) => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,.12)'; };
  const onBlur  = (e) => { e.target.style.borderColor = isDark ? '#334155' : '#e2e8f0'; e.target.style.boxShadow = 'none'; };

  return (
    <div style={{ height: '100vh', overflow: 'hidden', display: 'flex', backgroundColor: isDark ? '#0f172a' : '#f8fafc', transition: 'background .3s' }}>

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:block relative overflow-hidden" style={{ width: '55%' }}>
        <img
          src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&q=80&w=2000"
          alt="HR Teamwork"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(29,78,216,.92) 0%, rgba(15,23,42,.95) 100%)' }} />
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '3rem 4rem', height: '100%' }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
            <img src="/logo.png" alt="RH Logo" style={{ width: 44, height: 44, borderRadius: 12, background: '#fff', objectFit: 'contain', padding: 4 }} />
            <span style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>RH Management</span>
          </div>

          <h1 style={{ color: '#fff', fontSize: 48, fontWeight: 800, lineHeight: 1.15, marginBottom: 20 }}>
            {t('auth.joinPlatform').split('notre plateforme')[0]}<br /><span style={{ color: '#93c5fd' }}>{t('auth.joinPlatform').includes('notre plateforme') ? 'notre plateforme.' : 'our platform.'}</span>
          </h1>
          <p style={{ color: '#bfdbfe', fontSize: 17, lineHeight: 1.7, maxWidth: 340 }}>
            {t('auth.joinPlatformDesc')}
          </p>

          {/* Features */}
          <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { Icon: Users,  title: t('auth.centralizedDirectory'),     desc: t('auth.centralizedDirectoryDesc') },
              { Icon: Zap,    title: t('auth.realtimeAnalytics'),   desc: t('auth.realtimeAnalyticsDesc') },
              { Icon: Shield, title: t('auth.enterpriseSecurity'),      desc: t('auth.enterpriseSecurityDesc') },
            ].map(({ Icon, title, desc }) => (
              <div key={title} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 42, height: 42, background: 'rgba(255,255,255,.1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(255,255,255,.2)' }}>
                  <Icon style={{ width: 20, height: 20, color: '#93c5fd' }} />
                </div>
                <div>
                  <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{title}</div>
                  <div style={{ color: '#93c5fd', fontSize: 13 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative', backgroundColor: isDark ? '#0f172a' : '#ffffff', transition: 'background .3s', overflow: 'hidden' }}>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          style={{ position: 'absolute', top: 24, right: 24, padding: '10px', borderRadius: 12, background: isDark ? '#1e293b' : '#f1f5f9', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, color: isDark ? '#94a3b8' : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          aria-label="Changer de thème"
        >
          {isDark ? <Sun style={{ width: 20, height: 20 }} /> : <Moon style={{ width: 20, height: 20 }} />}
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ width: '100%', maxWidth: 420 }}
        >
          {/* Mobile logo */}
          <div className="lg:hidden" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <img src="/logo.png" alt="RH Logo" style={{ width: 36, height: 36, borderRadius: 10, background: '#fff', objectFit: 'contain', padding: 3 }} />
            <span style={{ fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a', fontSize: 16 }}>RH Management</span>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 30, fontWeight: 800, color: isDark ? '#f1f5f9' : '#0f172a', marginBottom: 8, letterSpacing: '-.02em' }}>
              {t('auth.createAccount')}
            </h2>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderRadius: 10, background: isDark ? 'rgba(239,68,68,.1)' : '#fef2f2', border: `1px solid ${isDark ? 'rgba(239,68,68,.3)' : '#fecaca'}`, color: isDark ? '#f87171' : '#dc2626', fontSize: 14, fontWeight: 500 }}
              >
                <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Name row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { name: 'prenom', label: t('employees.form.firstName'), placeholder: 'Jean',   icon: User },
                { name: 'nom',    label: t('employees.form.lastName'),    placeholder: 'Dupont', icon: User },
              ].map(({ name, label, placeholder, icon: Icon }) => (
                <div key={name}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: isDark ? '#cbd5e1' : '#374151', marginBottom: 8 }}>
                    <Icon style={{ width: 14, height: 14, color: '#2563eb' }} />
                    {label}
                  </label>
                  <input
                    name={name}
                    type="text"
                    placeholder={placeholder}
                    value={formData[name]}
                    onChange={handleChange}
                    required
                    style={inputStyle}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  />
                </div>
              ))}
            </div>

            {/* Email */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: isDark ? '#cbd5e1' : '#374151', marginBottom: 8 }}>
                <Mail style={{ width: 14, height: 14, color: '#2563eb' }} />
                {t('auth.email')}
              </label>
              <input
                name="email"
                type="email"
                placeholder="nom@entreprise.com"
                value={formData.email}
                onChange={handleChange}
                required
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: isDark ? '#cbd5e1' : '#374151', marginBottom: 8 }}>
                <Lock style={{ width: 14, height: 14, color: '#2563eb' }} />
                {t('auth.password')}
              </label>
              <input
                name="password"
                type="password"
                placeholder={t('auth.minPasswordLength')}
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
                required
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
              <p style={{ marginTop: 6, fontSize: 12, color: isDark ? '#64748b' : '#9ca3af', paddingLeft: 2 }}>
                {t('auth.passwordReq')}
              </p>
            </div>

            {/* Submit */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              style={{ marginTop: 4, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: '#2563eb', color: '#fff', fontWeight: 700, fontSize: 15, padding: '15px 24px', borderRadius: 12, border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1, boxShadow: '0 4px 14px rgba(37,99,235,.35)', fontFamily: 'inherit' }}
            >
              {isLoading ? (
                <><Loader2 style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} />{t('auth.creatingAccount')}</>
              ) : (
                <>{t('auth.signUpBtn')} <ArrowRight style={{ width: 16, height: 16 }} /></>
              )}
            </motion.button>
          </form>

          <p style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: isDark ? '#94a3b8' : '#6b7280' }}>
            {t('auth.hasAccount')}{' '}
            <Link to="/login" style={{ fontWeight: 700, color: '#2563eb', textDecoration: 'none' }}>
              {t('auth.signIn')}
            </Link>
          </p>
        </motion.div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Register;
