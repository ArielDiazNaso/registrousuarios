import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { useTheme } from '../../hooks/useTheme.js';
import { ThemeToggle } from '../ui/ThemeToggle.jsx';
import { Button } from '../ui/Button.jsx';

export const Layout = ({ children, activeView = null, onNavigate = null }) => {
  const { user, isAuthenticated, logout, loading } = useAuth();
  const { isDark } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: '📊' },
    { key: 'profile', label: 'Mi Perfil', icon: '👤' },
    { key: 'users', label: 'Usuarios', icon: '👥' },
    { key: 'settings', label: 'Ajustes', icon: '⚙️' },
  ];

  const handleNav = (key) => {
    setSidebarOpen(false);
    if (onNavigate) onNavigate(key);
  };

  const handleLogout = async () => {
    await logout();
    if (onNavigate) onNavigate('login');
  };

  return (
    <div className={`app-layout ${isDark ? 'theme-dark' : 'theme-light'}`}>
      <header className="app-header">
        <div className="app-header-left">
          {isAuthenticated && (
            <button
              type="button"
              className="icon-btn menu-toggle"
              onClick={() => setSidebarOpen((s) => !s)}
              aria-label={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={sidebarOpen}
            >
              {sidebarOpen ? '✕' : '☰'}
            </button>
          )}
          <div className="app-brand" onClick={() => handleNav('dashboard')} role="button" tabIndex={0}>
            <span className="brand-logo">🔐</span>
            <span className="brand-name">UserHub</span>
          </div>
        </div>

        <nav className="app-header-right">
          <ThemeToggle showLabel />
          {isAuthenticated && user && (
            <div className="user-menu">
              <div className="user-avatar" title={user.email}>
                <span className="avatar-initials">
                  {(user.first_name?.[0] || user.username?.[0] || 'U').toUpperCase()}
                  {(user.last_name?.[0] || '').toUpperCase()}
                </span>
              </div>
              <div className="user-menu-details">
                <span className="user-menu-name">
                  {user.first_name} {user.last_name}
                </span>
                <span className="user-menu-role">{user.role?.role_name || 'Usuario'}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                loading={loading}
                className="btn-logout"
              >
                Cerrar sesión
              </Button>
            </div>
          )}
        </nav>
      </header>

      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="app-main">
        {isAuthenticated && (
          <aside
            className={`app-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}
            aria-label="Navegación principal"
          >
            <ul className="sidebar-nav">
              {navItems.map((item) => (
                <li key={item.key}>
                  <button
                    type="button"
                    className={`sidebar-item ${activeView === item.key ? 'active' : ''}`}
                    onClick={() => handleNav(item.key)}
                  >
                    <span className="sidebar-icon" aria-hidden="true">
                      {item.icon}
                    </span>
                    <span className="sidebar-label">{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="sidebar-footer">
              <div className="sidebar-version">v1.0.0</div>
            </div>
          </aside>
        )}

        <main className="app-content" id="main-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
