import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // sends the httpOnly refresh-token cookie
});

// Attach the in-memory access token to every request
let accessToken = null;
export const setAccessToken = (token) => {
  accessToken = token;
};
export const getAccessToken = () => accessToken;

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

// On a 401 (expired access token), try refreshing once, then retry the original request.
// This is the standard short-lived-access + long-lived-refresh rotation pattern.
let refreshPromise = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && !original.url.includes("/auth/")) {
      original._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = axios
            .post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true })
            .finally(() => (refreshPromise = null));
        }
        const { data } = await refreshPromise;
        setAccessToken(data.data.accessToken);
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(original);
      } catch (refreshErr) {
        setAccessToken(null);
        return Promise.reject(refreshErr);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
