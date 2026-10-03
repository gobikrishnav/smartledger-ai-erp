import axios from 'axios';

const rawApiUrl = import.meta.env.VITE_API_URL;
const baseURL = rawApiUrl ? `${rawApiUrl.replace(/\/$/, '')}/api` : '/api';

const client = axios.create({
  baseURL,
});

client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('smartledger_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response &&
      (error.response.status === 401 ||
        (error.response.status === 400 && String(error.response.data?.error).toLowerCase().includes('token')))
    ) {
      localStorage.removeItem('smartledger_token');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default client;
