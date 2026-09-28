import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const TOKEN_EXPIRY_KEY = 'auth_token_expiry';

const authApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000,
});

authApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

authApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== '/auth/login'
    ) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        if (!refreshToken) {
          clearAuthStorage();
          return Promise.reject(error);
        }
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });
        setAuthTokens(data.token, data.refreshToken, data.expiresIn);
        originalRequest.headers.Authorization = `Bearer ${data.token}`;
        return authApi(originalRequest);
      } catch (refreshError) {
        clearAuthStorage();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

const clearAuthStorage = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
};

const setAuthTokens = (token, refreshToken, expiresInSeconds = 3600) => {
  const expiry = Date.now() + expiresInSeconds * 1000;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken || '');
  localStorage.setItem(TOKEN_EXPIRY_KEY, String(expiry));
};

const isTokenExpired = () => {
  const expiryStr = localStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!expiryStr) return true;
  const expiry = parseInt(expiryStr, 10);
  return Date.now() >= expiry;
};

const getStoredToken = () => {
  if (isTokenExpired()) return null;
  return localStorage.getItem(TOKEN_KEY);
};

const handleApiError = (error) => {
  let message = 'Error inesperado. Intente nuevamente.';
  let code = 'UNKNOWN_ERROR';
  let details = null;

  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;
    code = data?.code || `HTTP_${status}`;
    details = data?.details || data?.errors || null;

    switch (status) {
      case 400:
        message = data?.message || 'Datos de entrada inválidos.';
        break;
      case 401:
        message = data?.message || 'Credenciales inválidas o sesión expirada.';
        break;
      case 403:
        message = data?.message || 'No tiene permisos para realizar esta acción.';
        break;
      case 404:
        message = data?.message || 'Recurso no encontrado.';
        break;
      case 409:
        message = data?.message || 'Conflicto: el recurso ya existe.';
        break;
      case 422:
        message = data?.message || 'Validación fallida. Revise los campos.';
        break;
      case 500:
        message = 'Error interno del servidor. Intente más tarde.';
        break;
      case 503:
        message = 'Servicio no disponible temporalmente.';
        break;
      default:
        message = data?.message || `Error HTTP ${status}.`;
    }
  } else if (error.request) {
    message = 'No se pudo conectar con el servidor. Verifique su conexión.';
    code = 'NETWORK_ERROR';
  } else if (error.message) {
    message = error.message;
    code = 'CLIENT_ERROR';
  }

  return { message, code, details, originalError: error };
};

const mockUser = {
  user_id: 1,
  email: 'demo@example.com',
  username: 'demo_user',
  first_name: 'María',
  last_name: 'González',
  avatar_url: null,
  role: {
    role_id: 4,
    role_code: 'USER',
    role_name: 'Usuario Estándar',
  },
  permissions: ['profile.read', 'profile.update'],
  email_verified: true,
  status_code: 'ACTIVE',
  timezone: 'UTC',
  locale: 'es',
  biography: 'Usuario de demostración del sistema.',
};

const generateMockToken = () => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      sub: mockUser.user_id,
      email: mockUser.email,
      role: mockUser.role.role_code,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    })
  );
  const signature = btoa('mock-signature-' + Date.now());
  return `${header}.${payload}.${signature}`;
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const authService = {
  async login(credentials) {
    try {
      const { email, password } = credentials;
      if (!email || !password) {
        throw { response: { status: 400, data: { message: 'Email y contraseña son obligatorios.' } } };
      }

      // 1. Intentar llamar a la API real de XAMPP MySQL
      try {
        const res = await authApi.post('/auth/login', credentials);
        if (res.data && res.data.success) {
          const { token, refreshToken, expiresIn, user } = res.data.data;
          setAuthTokens(token, refreshToken || '', expiresIn || 3600);
          return { success: true, data: res.data.data };
        }
      } catch (apiErr) {
        if (apiErr.response && apiErr.response.status !== 503) {
          throw apiErr;
        }
        console.warn('API local no respondió, usando modo demo offline:', apiErr.message);
      }

      // Modo demo fallback
      await delay(600);
      const token = generateMockToken();
      const refreshToken = btoa('refresh_' + Date.now() + '_' + email);
      setAuthTokens(token, refreshToken, 3600);

      return {
        success: true,
        data: {
          token,
          refreshToken,
          expiresIn: 3600,
          user: { ...mockUser, email },
        },
      };
    } catch (error) {
      return {
        success: false,
        ...handleApiError(error),
      };
    }
  },

  async register(userData) {
    try {
      const { email, username, password, first_name, last_name } = userData;
      if (!email || !username || !password || !first_name || !last_name) {
        throw { response: { status: 400, data: { message: 'Todos los campos son obligatorios.' } } };
      }

      // 1. Intentar registrar en backend XAMPP MySQL
      try {
        const res = await authApi.post('/auth/register', userData);
        if (res.data && res.data.success) {
          const { token, refreshToken, expiresIn, user } = res.data.data;
          setAuthTokens(token, refreshToken || '', expiresIn || 3600);
          return { success: true, data: res.data.data };
        }
      } catch (apiErr) {
        if (apiErr.response && apiErr.response.status !== 503) {
          throw apiErr;
        }
        console.warn('API local no respondió, usando modo demo offline:', apiErr.message);
      }

      await delay(700);
      const token = generateMockToken();
      const refreshToken = btoa('refresh_' + Date.now() + '_' + email);
      setAuthTokens(token, refreshToken, 3600);

      return {
        success: true,
        data: {
          token,
          refreshToken,
          expiresIn: 3600,
          user: { ...mockUser, email, username, first_name, last_name },
        },
      };
    } catch (error) {
      return {
        success: false,
        ...handleApiError(error),
      };
    }
  },

  async getUsers() {
    try {
      const res = await authApi.get('/users');
      if (res.data && res.data.success) {
        return { success: true, data: res.data.data };
      }
      return { success: false, data: [] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async createUser(userData) {
    try {
      const res = await authApi.post('/users', userData);
      if (res.data && res.data.success) {
        return { success: true, data: res.data.data };
      }
      return { success: false, message: res.data?.message || 'No se pudo crear el usuario.' };
    } catch (error) {
      return { success: false, ...handleApiError(error) };
    }
  },

  async updateUser(userId, userData) {
    try {
      const res = await authApi.put(`/users/${userId}`, userData);
      if (res.data && res.data.success) {
        return { success: true, data: res.data.data };
      }
      return { success: false, message: res.data?.message || 'No se pudo actualizar el usuario.' };
    } catch (error) {
      return { success: false, ...handleApiError(error) };
    }
  },

  async updateUserStatus(userId, status) {
    try {
      const res = await authApi.patch(`/users/${userId}/status`, { status });
      if (res.data && res.data.success) {
        return { success: true, data: res.data.data };
      }
      return { success: false, message: res.data?.message || 'No se pudo actualizar el estado.' };
    } catch (error) {
      return { success: false, ...handleApiError(error) };
    }
  },

  async deleteUser(userId) {
    try {
      const res = await authApi.delete(`/users/${userId}`);
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, ...handleApiError(error) };
    }
  },

  async logout() {
    try {
      await delay(200);
      clearAuthStorage();
      return { success: true };
    } catch (error) {
      clearAuthStorage();
      return { success: false, ...handleApiError(error) };
    }
  },

  async getCurrentUser() {
    try {
      const token = getStoredToken();
      if (!token) {
        return { success: false, message: 'Sesión no iniciada.', code: 'NO_TOKEN' };
      }
      await delay(300);
      return { success: true, data: { ...mockUser } };
    } catch (error) {
      return { success: false, ...handleApiError(error) };
    }
  },

  async updateProfile(userId, profileData) {
    try {
      if (!userId) {
        throw { response: { status: 400, data: { message: 'ID de usuario requerido.' } } };
      }
      try {
        const res = await authApi.put(`/profile/${userId}`, profileData);
        if (res.data && res.data.success) {
          return { success: true, data: { ...mockUser, ...profileData } };
        }
      } catch (apiErr) {
        console.warn('API local no respondió en updateProfile, fallback local.');
      }

      await delay(500);
      return { success: true, data: { ...mockUser, ...profileData } };
    } catch (error) {
      return { success: false, ...handleApiError(error) };
    }
  },

  async changePassword(userId, passwordData) {
    try {
      const { currentPassword, newPassword } = passwordData;
      if (!currentPassword || !newPassword) {
        throw { response: { status: 400, data: { message: 'Contraseñas son obligatorias.' } } };
      }
      if (newPassword.length < 8) {
        throw {
          response: {
            status: 422,
            data: { message: 'La nueva contraseña debe tener al menos 8 caracteres.', code: 'WEAK_PASSWORD' },
          },
        };
      }
      await delay(600);
      return { success: true, data: { updated: true } };
    } catch (error) {
      return { success: false, ...handleApiError(error) };
    }
  },

  clearAuthStorage,
  setAuthTokens,
  isTokenExpired,
  getStoredToken,
};

export default authService;
