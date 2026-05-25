import axios from 'axios';

export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Inject JWT token on every request except the login endpoint itself
api.interceptors.request.use((config) => {
  const isLoginEndpoint = config.url?.includes('/api/login');
  if (!isLoginEndpoint) {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Callback registered by AuthContext so 401s trigger a clean React logout
// instead of a hard page reload
let unauthorizedHandler = null;
export const setUnauthorizedHandler = (handler) => { unauthorizedHandler = handler; };

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginEndpoint = error.config?.url?.includes('/api/login');

    if (error.response?.status === 401 && !isLoginEndpoint) {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user');
      if (unauthorizedHandler) {
        unauthorizedHandler();
      } else {
        window.location.href = '/login';
      }
    }

    // Improve timeout error message
    if (error.code === 'ECONNABORTED') {
      error.message = 'La requête a expiré. Vérifiez votre connexion.';
    }

    return Promise.reject(error);
  }
);

export default api;

// ─── Auth ───────────────────────────────────────────────────────────────────
export const authApi = {
  login:          (email, password)                  => api.post('/api/login', { email, password }),
  me:             ()                                 => api.get('/api/me'),
  register:       (data)                             => api.post('/api/register', data),
  changePassword: (currentPassword, newPassword)     => api.post('/api/change-password', { currentPassword, newPassword }),
};

// ─── Employés ────────────────────────────────────────────────────────────────
export const employeApi = {
  list:        (params = {})    => api.get('/api/employes', { params }),
  show:        (id)             => api.get(`/api/employes/${id}`),
  create:      (data)           => api.post('/api/employes', data),
  update:      (id, data)       => api.put(`/api/employes/${id}`, data),
  delete:      (id)             => api.delete(`/api/employes/${id}`),
  uploadPhoto: (id, formData)   => api.post(`/api/employes/${id}/photo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

// ─── Services ────────────────────────────────────────────────────────────────
export const serviceApi = {
  list:   ()         => api.get('/api/services'),
  show:   (id)       => api.get(`/api/services/${id}`),
  create: (data)     => api.post('/api/services', data),
  update: (id, data) => api.put(`/api/services/${id}`, data),
  delete: (id)       => api.delete(`/api/services/${id}`),
};

// ─── Congés ──────────────────────────────────────────────────────────────────
export const congeApi = {
  list:    (params = {})    => api.get('/api/conges', { params }),
  show:    (id)             => api.get(`/api/conges/${id}`),
  create:  (data)           => api.post('/api/conges', data),
  approve: (id, data = {})  => api.put(`/api/conges/${id}/approve`, data),
  reject:  (id, data = {})  => api.put(`/api/conges/${id}/reject`, data),
};

// ─── Absences ────────────────────────────────────────────────────────────────
export const absenceApi = {
  list:   (params = {})    => api.get('/api/absences', { params }),
  create: (data)           => api.post('/api/absences', data),
  update: (id, data)       => api.put(`/api/absences/${id}`, data),
};

// ─── Attestations ────────────────────────────────────────────────────────────
export const attestationApi = {
  list:     ()   => api.get('/api/attestations'),
  create:   (data) => api.post('/api/attestations', data),
  generate: (id) => api.post(`/api/attestations/${id}/generate`),
  sign:     (id) => api.post(`/api/attestations/${id}/sign`),
};

// ─── Formations ──────────────────────────────────────────────────────────────
export const formationApi = {
  list:       ()         => api.get('/api/formations'),
  show:       (id)       => api.get(`/api/formations/${id}`),
  create:     (data)     => api.post('/api/formations', data),
  update:     (id, data) => api.put(`/api/formations/${id}`, data),
  delete:     (id)       => api.delete(`/api/formations/${id}`),
  participer: (id)       => api.post(`/api/formations/${id}/participer`),
  quitter:    (id)       => api.delete(`/api/formations/${id}/quitter`),
};

// ─── Documents ───────────────────────────────────────────────────────────────
export const documentApi = {
  list:     (params = {})    => api.get('/api/documents', { params }),
  upload:   (formData)       => api.post('/api/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  download: (id)             => `${BASE_URL}/api/documents/${id}/download`,
  delete:   (id)             => api.delete(`/api/documents/${id}`),
};

// ─── Notifications ───────────────────────────────────────────────────────────
export const notificationApi = {
  list:       ()   => api.get('/api/notifications'),
  markRead:   (id) => api.put(`/api/notifications/${id}/read`),
  markAllRead: ()  => api.put('/api/notifications/read-all'),
};

// ─── Corrections ─────────────────────────────────────────────────────────────
export const correctionApi = {
  list:    ()         => api.get('/api/corrections'),
  show:    (id)       => api.get(`/api/corrections/${id}`),
  create:  (data)     => api.post('/api/corrections', data),
  approve: (id, data = {}) => api.put(`/api/corrections/${id}/approve`, data),
  reject:  (id, data = {}) => api.put(`/api/corrections/${id}/reject`, data),
};

// ─── Affectations ─────────────────────────────────────────────────────────────
export const affectationApi = {
  list:   (params = {})    => api.get('/api/affectations', { params }),
  create: (data)           => api.post('/api/affectations', data),
  delete: (id)             => api.delete(`/api/affectations/${id}`),
};
