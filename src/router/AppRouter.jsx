import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { ProtectedRoute } from './ProtectedRoute.jsx';
import { Layout } from '../components/layout/Layout.jsx';
import { LoginPage } from '../views/LoginPage.jsx';
import { RegisterPage } from '../views/RegisterPage.jsx';
import { Dashboard } from '../views/Dashboard.jsx';
import { Profile } from '../views/Profile.jsx';
import { UsersPage } from '../views/UsersPage.jsx';
import { SettingsPage } from '../views/SettingsPage.jsx';
import { NotFound } from '../views/NotFound.jsx';
import { useAuth } from '../hooks/useAuth.js';

const VIEW_MAP = {
  dashboard: 'dashboard',
  profile: 'profile',
  users: 'users',
  settings: 'settings',
  login: 'login',
  register: 'register',
};

const RouterLayout = () => {
  const navigate = useNavigate();
  const { loading, isAuthenticated } = useAuth();

  const handleNavigate = (view) => {
    if (!view) return;
    const routes = {
      dashboard: '/dashboard',
      profile: '/profile',
      users: '/users',
      settings: '/settings',
      login: '/login',
      register: '/register',
    };
    const target = routes[view] || VIEW_MAP[view] ? routes[VIEW_MAP[view]] : null;
    if (target) navigate(target);
  };

  const activeFromPath = (pathname) => {
    if (pathname.startsWith('/dashboard')) return 'dashboard';
    if (pathname.startsWith('/profile')) return 'profile';
    if (pathname.startsWith('/users')) return 'users';
    if (pathname.startsWith('/settings')) return 'settings';
    return null;
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-loading-inner">
          <div className="app-loading-logo">🔐</div>
          <h2>Cargando UserHub...</h2>
        </div>
      </div>
    );
  }

  return (
    <Layout
      activeView={activeFromPath(window.location.pathname)}
      onNavigate={handleNavigate}
    >
      <Routes>
        <Route
          path="/login"
          element={
            !isAuthenticated ? (
              <LoginPage
                onNavigateRegister={() => navigate('/register')}
                onSuccess={() => navigate('/dashboard', { replace: true })}
              />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
        <Route
          path="/register"
          element={
            !isAuthenticated ? (
              <RegisterPage
                onNavigateLogin={() => navigate('/login')}
                onSuccess={() => navigate('/dashboard', { replace: true })}
              />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
        <Route path="*" element={<NotFound onGoHome={() => navigate('/', { replace: true })} />} />
      </Routes>
    </Layout>
  );
};

export const AppRouter = () => {
  return <RouterLayout />;
};

export default AppRouter;
