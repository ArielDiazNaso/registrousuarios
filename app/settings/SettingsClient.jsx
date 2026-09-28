'use client';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../hooks/useToast';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';

const navItems = [
  { key: 'dashboard', label: 'Dashboard', icon: '📊', href: '/dashboard' },
  { key: 'profile', label: 'Mi Perfil', icon: '👤', href: '/profile' },
  { key: 'users', label: 'Usuarios', icon: '👥', href: '/users' },
  { key: 'settings', label: 'Ajustes', icon: '⚙️', href: '/settings' },
];

export default function SettingsClient({ user }) {
  const { isDark, toggleTheme } = useTheme();
  const toast = useToast();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={`app-layout ${isDark ? 'theme-dark' : 'theme-light'}`}>
      <header className="app-header">
        <div className="app-header-left">
          <button className="icon-btn menu-toggle" onClick={() => setSidebarOpen(s => !s)}>
            {sidebarOpen ? '✕' : '☰'}
          </button>
          <div className="app-brand" onClick={() => router.push('/dashboard')} role="button" tabIndex={0}>
            <span className="brand-logo">🔐</span>
            <span className="brand-name">UserHub</span>
          </div>
        </div>
        <nav className="app-header-right">
          <button className="icon-btn" onClick={toggleTheme}>{isDark ? '☀️' : '🌙'}</button>
          <div className="user-menu">
            <div className="user-avatar">
              <span className="avatar-initials">{(user?.name?.[0] ?? 'U').toUpperCase()}</span>
            </div>
            <div className="user-menu-details">
              <span className="user-menu-name">{user?.name}</span>
              <span className="user-menu-role">{user?.role ?? 'Usuario'}</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: '/login' })} className="btn-logout">
              Cerrar sesión
            </Button>
          </div>
        </nav>
      </header>
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}
      <div className="app-main">
        <aside className={`app-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
          <ul className="sidebar-nav">
            {navItems.map(item => (
              <li key={item.key}>
                <button
                  className={`sidebar-item ${item.key === 'settings' ? 'active' : ''}`}
                  onClick={() => { setSidebarOpen(false); router.push(item.href); }}
                >
                  <span className="sidebar-icon">{item.icon}</span>
                  <span className="sidebar-label">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
        <main className="app-content">
          <div className="settings-view view">
            <header className="view-header">
              <div>
                <h1 className="view-title">Ajustes</h1>
                <p className="view-subtitle">Configuración del sistema.</p>
              </div>
            </header>
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              <Card title="Apariencia" subtitle="Personaliza el aspecto de la aplicación">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontWeight: 600 }}>Modo oscuro</p>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                      {isDark ? 'Activo' : 'Inactivo'}
                    </p>
                  </div>
                  <Button variant="outline" onClick={toggleTheme}>
                    {isDark ? '☀️ Modo claro' : '🌙 Modo oscuro'}
                  </Button>
                </div>
              </Card>

              <Card title="Sesión" subtitle="Información de tu sesión actual">
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Email</span>
                    <span>{user?.email}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Proveedor</span>
                    <span className="badge badge-info">{user?.provider ?? 'oauth'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Rol</span>
                    <span className="badge badge-primary">{user?.role ?? 'USER'}</span>
                  </div>
                </div>
                <div style={{ marginTop: '1.5rem' }}>
                  <Button variant="danger" onClick={() => signOut({ callbackUrl: '/login' })}>
                    🚪 Cerrar sesión
                  </Button>
                </div>
              </Card>

              <Card title="Base de datos" subtitle="Estado de la conexión con Turso">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>🟢</span>
                  <div>
                    <p style={{ fontWeight: 600 }}>Turso (SQLite edge) — Conectado</p>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                      Las sesiones y usuarios se guardan en la nube de Turso.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
