import { useState, useEffect, useCallback, useMemo } from 'react';
import { Layout } from '../components/layout/Layout.jsx';
import { LoginPage } from '../views/LoginPage.jsx';
import { RegisterPage } from '../views/RegisterPage.jsx';
import { Dashboard } from '../views/Dashboard.jsx';
import { Profile } from '../views/Profile.jsx';
import { UsersPage } from '../views/UsersPage.jsx';
import { SettingsPage } from '../views/SettingsPage.jsx';
import { NotFound } from '../views/NotFound.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';
import { useAuth } from '../hooks/useAuth.js';

const VIEWS = {
  LOGIN: 'login',
  REGISTER: 'register',
  DASHBOARD: 'dashboard',
  PROFILE: 'profile',
  USERS: 'users',
  SETTINGS: 'settings',
  NOT_FOUND: 'not_found',
};

const AUTH_VIEWS = new Set([VIEWS.LOGIN, VIEWS.REGISTER]);

const getDefaultView = (isAuthenticated) => {
  try {
    const stored = localStorage.getItem('app_view');
    if (stored) {
      if (AUTH_VIEWS.has(stored)) return isAuthenticated ? VIEWS.DASHBOARD : stored;
      if (Object.values(VIEWS).includes(stored) && isAuthenticated) return stored;
    }
  } catch (_) {
    /* ignore */
  }
  return isAuthenticated ? VIEWS.DASHBOARD : VIEWS.LOGIN;
};

export const StateSystem = () => {
  const { isAuthenticated, loading, user } = useAuth();
  const [currentView, setCurrentView] = useState(() => getDefaultView(false));
  const [viewHistory, setViewHistory] = useState([]);

  useEffect(() => {
    try {
      localStorage.setItem('app_view', currentView);
    } catch (_) {
      /* ignore */
    }
  }, [currentView]);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated && !AUTH_VIEWS.has(currentView)) {
      setViewHistory((h) => [...h, currentView]);
      setCurrentView(VIEWS.LOGIN);
    } else if (isAuthenticated && AUTH_VIEWS.has(currentView)) {
      setCurrentView(VIEWS.DASHBOARD);
    }
  }, [isAuthenticated, loading, currentView]);

  const navigate = useCallback(
    (view, { replace = false, fromHistory = false } = {}) => {
      if (!Object.values(VIEWS).includes(view)) {
        setCurrentView(isAuthenticated ? VIEWS.NOT_FOUND : VIEWS.LOGIN);
        return;
      }

      const needsAuth = !AUTH_VIEWS.has(view);
      if (needsAuth && !isAuthenticated) {
        setCurrentView(VIEWS.LOGIN);
        return;
      }

      if (!AUTH_VIEWS.has(view) && !fromHistory) {
        setViewHistory((h) => (replace ? h : [...h, currentView]));
      }

      setCurrentView(view);
    },
    [isAuthenticated, currentView]
  );

  const goBack = useCallback(() => {
    setViewHistory((h) => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      setCurrentView(prev);
      return h.slice(0, -1);
    });
  }, []);

  const handleNavigate = useCallback(
    (view) => {
      navigate(view);
    },
    [navigate]
  );

  const handleLoginSuccess = useCallback(() => {
    const prior = viewHistory.length > 0 ? viewHistory[viewHistory.length - 1] : VIEWS.DASHBOARD;
    setViewHistory((h) => h.slice(0, -1));
    setCurrentView(AUTH_VIEWS.has(prior) ? VIEWS.DASHBOARD : prior);
  }, [viewHistory]);

  const activeSidebar = useMemo(() => {
    if (AUTH_VIEWS.has(currentView) || currentView === VIEWS.NOT_FOUND) return null;
    return currentView;
  }, [currentView]);

  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-loading-inner">
          <div className="app-loading-logo">🔐</div>
          <Spinner size="lg" label="Inicializando sistema..." />
        </div>
      </div>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case VIEWS.LOGIN:
        return (
          <LoginPage
            onNavigateRegister={() => navigate(VIEWS.REGISTER)}
            onSuccess={handleLoginSuccess}
          />
        );
      case VIEWS.REGISTER:
        return (
          <RegisterPage
            onNavigateLogin={() => navigate(VIEWS.LOGIN)}
            onSuccess={handleLoginSuccess}
          />
        );
      case VIEWS.DASHBOARD:
        return <Dashboard />;
      case VIEWS.PROFILE:
        return <Profile key={user?.user_id} />;
      case VIEWS.USERS:
        return <UsersPage />;
      case VIEWS.SETTINGS:
        return <SettingsPage />;
      case VIEWS.NOT_FOUND:
      default:
        return (
          <NotFound
            onGoHome={() => {
              if (viewHistory.length > 0) {
                goBack();
              } else {
                navigate(isAuthenticated ? VIEWS.DASHBOARD : VIEWS.LOGIN);
              }
            }}
          />
        );
    }
  };

  return (
    <Layout
      activeView={activeSidebar}
      onNavigate={handleNavigate}
      data-state-navigation="true"
    >
      <div className="state-router-root">
        {renderView()}
      </div>
    </Layout>
  );
};

export default StateSystem;
