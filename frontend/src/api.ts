import axios from 'axios';

// La URL base serà el backend Node local o el de producció en el futur
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('calibre_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('calibre_token');
      localStorage.removeItem('calibre_user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;
