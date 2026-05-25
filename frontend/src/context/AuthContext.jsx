import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { authApi, BASE_URL, setUnauthorizedHandler } from '../services/api';

const AuthContext = createContext();

// Map Symfony roles → frontend role keys
const ROLE_MAP = {
  ROLE_ADMIN_RH:            'HR_MANAGER',
  ROLE_AGENT_RH:            'HR_AGENT',
  ROLE_CHEF_SERVICE:        'DEPARTMENT_MANAGER',
  ROLE_SECRETAIRE_GENERALE: 'SECRETARY_GENERAL',
  ROLE_EMPLOYE:             'EMPLOYEE',
};

function mapSymfonyRoles(roles = []) {
  // Priority order: highest privilege first
  const priority = ['ROLE_ADMIN_RH', 'ROLE_SECRETAIRE_GENERALE', 'ROLE_AGENT_RH', 'ROLE_CHEF_SERVICE', 'ROLE_EMPLOYE'];
  for (const r of priority) {
    if (roles.includes(r)) return ROLE_MAP[r] ?? 'EMPLOYEE';
  }
  return 'EMPLOYEE';
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
      localStorage.removeItem('jwt_token');
    }
  }, [user]);

  // Build a consistent user object from the JWT payload / /api/me response
  const buildUserFromPayload = useCallback((jwtData, meData) => {
    const roles = meData?.roles ?? jwtData?.roles ?? ['ROLE_EMPLOYE'];
    const employe = meData?.employe ?? null;
    const role = mapSymfonyRoles(roles);

    const fullName = employe ? `${employe.prenom} ${employe.nom}`.trim() : (meData?.email ?? '');
    const photo = employe?.photo ?? null;
    const avatarName = encodeURIComponent(fullName || 'User');
    return {
      id:              meData?.id ?? jwtData?.id,
      email:           meData?.email ?? jwtData?.sub,
      roles,
      role,
      name:            fullName,
      title:           employe?.poste ?? role,
      dept:            employe?.service?.nom ?? '',
      matricule:       employe?.matricule ?? '',
      employe_id:      employe?.id ?? null,
      telephone:       employe?.telephone ?? '',
      dateRecrutement: employe?.dateRecrutement ? employe.dateRecrutement.substring(0, 10) : '',
      grade:           employe?.grade ?? '',
      photo,
      avatar:          photo
        ? `${BASE_URL}/uploads/${photo}`
        : `https://ui-avatars.com/api/?name=${avatarName}&background=2563EB&color=fff&size=64`,
      service_id:      employe?.service?.id ?? null,
      isActive:        meData?.isActive ?? true,
    };
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const { data: loginData } = await authApi.login(email, password);
      const token = loginData.token;
      if (!token) return { success: false, message: 'Token manquant dans la réponse' };

      localStorage.setItem('jwt_token', token);

      // Decode JWT payload (base64)
      let payload;
      try {
        payload = JSON.parse(atob(token.split('.')[1]));
      } catch {
        return { success: false, message: 'Token invalide reçu du serveur' };
      }

      // Fetch full user profile
      const { data: meResponse } = await authApi.me();
      const meData = meResponse.data;

      const userObj = buildUserFromPayload(payload, meData);
      setUser(userObj);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message ?? 'Identifiants incorrects';
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, [buildUserFromPayload]);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  // Register a clean React logout handler so 401s on protected routes
  // trigger setUser(null) instead of a hard page reload
  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { data: meResponse } = await authApi.me();
      const meData = meResponse.data;
      const fresh = buildUserFromPayload({}, meData);
      // Merge selectively — keep fields that /api/me doesn't return (e.g. custom local fields)
      setUser(prev => prev ? { ...prev, ...fresh } : prev);
    } catch { /* token expired → interceptor handles redirect */ }
  }, [buildUserFromPayload]);

  // effectiveRole kept for backwards compat with existing pages
  const effectiveRole = user?.role ?? null;

  return (
    <AuthContext.Provider value={{ user, setUser, effectiveRole, login, logout, refreshUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
