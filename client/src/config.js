const API_URL = import.meta.env.VITE_API_URL || "https://speech-to-text-backend-v9nm.onrender.com";

export const API_ENDPOINTS = {
  UPLOAD: `${API_URL}/api/upload`,
  HISTORY: `${API_URL}/api/history`,
};

export default API_URL;
