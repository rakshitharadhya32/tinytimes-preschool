import axios from 'axios';

// In local dev, Vite proxies /api to the backend (see vite.config.js), so a
// relative baseURL works. In production the frontend (e.g. Vercel) and the
// backend (e.g. Render) live on different domains, so set VITE_API_URL to
// the backend's full origin (e.g. https://kriyo-api.onrender.com).
const API_ORIGIN = import.meta.env.VITE_API_URL || '';

const api = axios.create({ baseURL: `${API_ORIGIN}/api` });

// Uploaded photos are returned as root-relative paths (e.g. /uploads/x.jpg).
// This resolves them against the API's origin so they load correctly even
// when the frontend is served from a different domain than the backend.
export function mediaUrl(path) {
  if (!path) return path;
  if (/^https?:\/\//.test(path)) return path;
  return `${API_ORIGIN}${path}`;
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('kriyo_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('kriyo_token');
      localStorage.removeItem('kriyo_user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
