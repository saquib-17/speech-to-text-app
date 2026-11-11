import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 90000, // 90s to comfortably allow local INT8 CPU inference
});

// Request interceptor: attach bearer token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("speechscribe_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle unauthorized errors
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "An unexpected server communication error occurred.";

    if (status === 401) {
      // Clear token if expired or invalid
      if (localStorage.getItem("speechscribe_token")) {
        localStorage.removeItem("speechscribe_token");
        window.dispatchEvent(new Event("speechscribe:unauthorized"));
      }
    }

    return Promise.reject({
      status,
      message,
      data: error.response?.data,
    });
  }
);

// API Service Functions
export const api = {
  // Auth Endpoints
  auth: {
    register: (payload) => apiClient.post("/api/auth/register", payload),
    login: (payload) => apiClient.post("/api/auth/login", payload),
    getMe: () => apiClient.get("/api/auth/me"),
  },

  // Transcript Management Endpoints
  transcripts: {
    getAll: (params = {}) => apiClient.get("/api/transcripts", { params }),
    getById: (id) => apiClient.get(`/api/transcripts/${id}`),
    update: (id, payload) => apiClient.put(`/api/transcripts/${id}`, payload),
    delete: (id) => apiClient.delete(`/api/transcripts/${id}`),
  },

  // Audio & Speech Recognition Endpoints
  audio: {
    upload: (formData, onUploadProgress) =>
      apiClient.post("/api/audio/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress,
      }),
    recording: (formData, onUploadProgress) =>
      apiClient.post("/api/audio/recording", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress,
      }),
    transcribe: (formData, onUploadProgress) =>
      apiClient.post("/api/audio/transcribe", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress,
      }),
  },

  // AI Intelligence Endpoints
  ai: {
    summarize: (id) => apiClient.post(`/api/ai/summarize/${id}`),
    ask: (id, question) => apiClient.post(`/api/ai/ask/${id}`, { question }),
    getQuota: () => apiClient.get("/api/ai/quota"),
  },

  // System Health
  health: {
    check: () => apiClient.get("/api/health"),
  },
};

export default api;

