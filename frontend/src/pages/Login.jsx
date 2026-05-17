import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import {
  Mail, Lock, ArrowRight, Loader2,
  Sun, Moon, AlertCircle, ChevronDown
} from 'lucide-react';

const Login = () => {
  const { login }           = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate            = useNavigate();
  const { t }               = useTranslation();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole]         = useState('HR_MANAGER');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]       = useState('');

  const roles = [
    { id: 'EMPLOYEE', label: t('auth.employee') },
    { id: 'HR_AGENT', label: t('auth.hrAgent') },
    { id: 'HR_MANAGER', label: t('auth.hrManager') },
    { id: 'DEPARTMENT_MANAGER', label: t('auth.manager') },
    { id: 'INTERIM_MANAGER', label: t('auth.interimManager') }
  ];

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setTimeout(() => {
      const result = login(email, password, role);
      if (result?.success) {
        navigate('/dashboard');
      } else {
        setError(t('auth.invalidCredentials'));
        setIsLoading(false);
      }
    }, 1200);
  };

  const isDark = theme === 'dark';

  /* ─── shared inline styles (bypass Tailwind dark: issues with native inputs) ─── */
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

  const selectStyle = { ...inputStyle, cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none' };

  return (
    <div style={{ height: '100vh', overflow: 'hidden', display: 'flex', backgroundColor: isDark ? '#0f172a' : '#f8fafc', transition: 'background .3s' }}>

      {/* ── LEFT PANEL ── */}
      <div style={{ display: 'none' }} className="lg:flex" style2={{ width: '55%', position: 'relative', overflow: 'hidden', display: 'flex' }}>
        {/* We keep this as Tailwind since it's purely decorative */}
      </div>
      <div className="hidden lg:block relative overflow-hidden" style={{ width: '55%' }}>
        <img
          src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=2000"
          alt="Office"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(29,78,216,.92) 0%, rgba(15,23,42,.95) 100%)' }} />
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '3rem 4rem', height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
            <img src="/logo.png" alt="RH Logo" style={{ width: 44, height: 44, borderRadius: 12, background: '#fff', objectFit: 'contain', padding: 4 }} />
            <span style={{ color: '#fff', fontSize: 18, fontWeight: 700, letterSpacing: '-.01em' }}>RH Management</span>
          </div>
          <h1 style={{ color: '#fff', fontSize: 48, fontWeight: 800, lineHeight: 1.15, marginBottom: 20 }}>
            {t('auth.welcomeBack').split('chez vous')[0]}<br /><span style={{ color: '#93c5fd' }}>{t('auth.welcomeBack').includes('chez vous') ? 'chez vous.' : 'home.'}</span>
          </h1>
          <p style={{ color: '#bfdbfe', fontSize: 17, lineHeight: 1.7, maxWidth: 340 }}>
            {t('auth.welcomeBackDesc')}
          </p>
          <div style={{ marginTop: 48, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
            {[['2 400+', t('auth.activeEmpLabel')],['18', t('auth.deptsLabel')],['98 %', t('auth.satisfactionLabel')]].map(([v,l]) => (
              <div key={l} style={{ background: 'rgba(255,255,255,.1)', backdropFilter: 'blur(8px)', borderRadius: 16, padding: '18px 14px', border: '1px solid rgba(255,255,255,.2)' }}>
                <div style={{ color: '#fff', fontSize: 22, fontWeight: 800 }}>{v}</div>
                <div style={{ color: '#bfdbfe', fontSize: 12, marginTop: 4, fontWeight: 500 }}>{l}</div>
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

          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 30, fontWeight: 800, color: isDark ? '#f1f5f9' : '#0f172a', marginBottom: 0, letterSpacing: '-.02em' }}>
              {t('auth.signIn')}
            </h2>
          </div>

          {/* Error */}
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

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Role */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: isDark ? '#cbd5e1' : '#374151', marginBottom: 8 }}>
                {t('auth.role')}
              </label>
              <div style={{ position: 'relative' }}>
                <select value={role} onChange={(e) => setRole(e.target.value)} style={selectStyle} required>
                  {roles.map((r) => <option key={r.id} value={r.id} style={{ background: isDark ? '#1e293b' : '#fff', color: isDark ? '#f1f5f9' : '#0f172a' }}>{r.label}</option>)}
                </select>
                <ChevronDown style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: isDark ? '#64748b' : '#9ca3af', pointerEvents: 'none' }} />
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: isDark ? '#cbd5e1' : '#374151', marginBottom: 8 }}>
                {t('auth.email')}
              </label>
              <input
                type="email"
                placeholder="nom@entreprise.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,.12)'; }}
                onBlur={(e)  => { e.target.style.borderColor = isDark ? '#334155' : '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            {/* Password */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: isDark ? '#cbd5e1' : '#374151' }}>
                  {t('auth.password')}
                </label>
                <Link to="/forgot-password" style={{ fontSize: 13, fontWeight: 700, color: '#2563eb', textDecoration: 'none' }}>
                  {t('auth.forgotPassword').replace(' ?', '').replace('?', '')}
                </Link>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,.12)'; }}
                onBlur={(e)  => { e.target.style.borderColor = isDark ? '#334155' : '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            {/* Submit */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              style={{ marginTop: 4, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: '#2563eb', color: '#fff', fontWeight: 700, fontSize: 15, padding: '15px 24px', borderRadius: 12, border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1, boxShadow: '0 4px 14px rgba(37,99,235,.35)', fontFamily: 'inherit', transition: 'background .15s' }}
              onMouseEnter={(e) => { if (!isLoading) e.target.style.background = '#1d4ed8'; }}
              onMouseLeave={(e) => { e.target.style.background = '#2563eb'; }}
            >
              {isLoading ? (
                <><Loader2 style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} />{t('auth.signingIn')}</>
              ) : (
                <>{t('auth.signIn')} <ArrowRight style={{ width: 16, height: 16 }} /></>
              )}
            </motion.button>
          </form>

          <p style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: isDark ? '#94a3b8' : '#6b7280' }}>
            {t('auth.noAccount')}{' '}
            <Link to="/register" style={{ fontWeight: 700, color: '#2563eb', textDecoration: 'none' }}>
              {t('auth.createAccount')}
            </Link>
          </p>
        </motion.div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Login;
