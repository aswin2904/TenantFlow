import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const activeOrgId = localStorage.getItem('activeOrgId');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (activeOrgId) {
    config.headers['x-organization-id'] = activeOrgId;
  }
  return config;
});

export default api;
