import { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { authService } from '../services/authService.js';

export const AuthContext = createContext(null);

const INITIAL_STATE = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true,
  error: null,
};

const USER_STORAGE_KEY = 'auth_user';

export const AuthProvider = ({ children }) => {
  const [state, setState] = useState(INITIAL_STATE);
  const [initialized, setInitialized] = useState(false);

  const hydrateFromStorage = useCallback(() => {
    try {
      const token = authService.getStoredToken();
      const userStr = localStorage.getItem(USER_STORAGE_KEY);
      const user = userStr ? JSON.parse(userStr) : null;

      if (token && user) {
        setState({
          user,
          token,
          isAuthenticated: true,
          loading: false,
          error: null,
        });
        return true;
      }
      return false;
    } catch (err) {
      console.error('[AuthProvider] Error al hidratar:', err);
      authService.clearAuthStorage();
      localStorage.removeItem(USER_STORAGE_KEY);
      return false;
    }
  }, []);

  useEffect(() => {
    const hasHydrated = hydrateFromStorage();
    if (!hasHydrated) {
      setState((prev) => ({ ...prev, loading: false }));
    }
    setInitialized(true);

    const handleStorageSync = (e) => {
      if (e.key === 'auth_token' && !e.newValue) {
        setState(INITIAL_STATE);
      }
    };
    window.addEventListener('storage', handleStorageSync);
    return () => window.removeEventListener('storage', handleStorageSync);
  }, [hydrateFromStorage]);

  useEffect(() => {
    if (!state.token || initialized) return;
    const interval = setInterval(() => {
      if (authService.isTokenExpired()) {
        logout();
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [state.token, initialized]);

  const login = useCallback(async (credentials) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    const result = await authService.login(credentials);

    if (result.success) {
      const { user, token } = result.data;
      try {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      } catch (err) {
        console.error('[Auth] Error persistiendo usuario:', err);
      }
      setState({
        user,
        token,
        isAuthenticated: true,
        loading: false,
        error: null,
      });
      return { success: true, data: result.data };
    }

    setState((prev) => ({
      ...prev,
      loading: false,
      error: result.message,
    }));
    return result;
  }, []);

  const register = useCallback(async (userData) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    const result = await authService.register(userData);

    if (result.success) {
      const { user, token } = result.data;
      try {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      } catch (err) {
        console.error('[Auth] Error persistiendo usuario:', err);
      }
      setState({
        user,
        token,
        isAuthenticated: true,
        loading: false,
        error: null,
      });
      return { success: true, data: result.data };
    }

    setState((prev) => ({
      ...prev,
      loading: false,
      error: result.message,
    }));
    return result;
  }, []);

  const logout = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
    await authService.logout();
    localStorage.removeItem(USER_STORAGE_KEY);
    setState(INITIAL_STATE);
    return { success: true };
  }, []);

  const updateUser = useCallback((updates) => {
    setState((prev) => {
      if (!prev.user) return prev;
      const updated = { ...prev.user, ...updates };
      try {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('[Auth] Error actualizando usuario en storage:', err);
      }
      return { ...prev, user: updated };
    });
  }, []);

  const hasPermission = useCallback(
    (permissionCode) => {
      if (!state.user?.permissions) return false;
      if (state.user.role?.role_code === 'SUPER_ADMIN') return true;
      return state.user.permissions.includes(permissionCode);
    },
    [state.user]
  );

  const hasRole = useCallback(
    (roleCode) => {
      return state.user?.role?.role_code === roleCode;
    },
    [state.user]
  );

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      login,
      register,
      logout,
      updateUser,
      hasPermission,
      hasRole,
      clearError,
    }),
    [state, login, register, logout, updateUser, hasPermission, hasRole, clearError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
