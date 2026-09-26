import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;

/**
 * Raw Axios instance for the ITSM backend.
 * Add interceptors & auth headers later once auth is implemented.
 */
export const healthApi = {
  /** GET /api/health */
  getHealth: () => api.get('/health').then((res) => res.data),
};
