import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Bot control
export const startBot = () => api.post('/bot/start');
export const stopBot = () => api.post('/bot/stop');
export const getBotStatus = () => api.get('/bot/status');

// Environment variables
export const getEnvVars = () => api.get('/env');
export const updateEnvVars = (data: { TELEGRAM_BOT_TOKEN: string }) => api.post('/env', data);

// Menu configuration
export const getMenuConfig = () => api.get('/menu');
export const updateMenuConfig = (data: { menuString: string }) => api.post('/menu', data);

// Logs
export const getLogs = (limit = 100, offset = 0) => api.get(`/logs?limit=${limit}&offset=${offset}`);
export const clearLogs = () => api.delete('/logs');

export default api;