// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// WebSocket Configuration
const getWebSocketURL = () => {
  const apiUrl = new URL(API_BASE_URL);
  const protocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${apiUrl.host}`;
};

const WS_BASE_URL = getWebSocketURL();

export { API_BASE_URL, WS_BASE_URL };