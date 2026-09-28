'use client';
import { signOut } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../hooks/useToast';
import { Card, StatCard } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';

const stats = [
  { label: 'Usuarios Activos', value: '1,284', icon: '👥', trend: { label: '+12% este mes', direction: 'up' }, accent: 'primary' },
  { label: 'Sesiones Hoy', value: '342', icon: '🔐', trend: { label: '+5.2% vs ayer', direction: 'up' }, accent: 'success' },
  { label: 'Errores Login', value: '7', icon: '⚠️', trend: { label: '-18% vs semana', direction: 'down' }, accent: 'warning' },
  { label: 'Registros Nuevos', value: '56', icon: '🎉', trend: { label: '+24% esta semana', direction: 'up' }, accent: 'purple' },
];

const recentActivity = [
  { user: 'Carlos Pérez', action: 'Actualizó su perfil', time: 'Hace 2 min', type: 'profile' },
  { user: 'Ana Martínez', action: 'Inició sesión exitosamente', time: 'Hace 8 min', type: 'login' },
  { user: 'Luis Rodríguez', action: 'Falló al autenticarse', time: 'Hace 12 min', type: 'error' },
  { user: 'Sofía López', action: 'Cambió su contraseña', time: 'Hace 25 min', type: 'security' },
  { user: 'Javier Gómez', action: 'Se registró en el sistema', time: 'Hace 45 min', type: 'register' },
];

const badgeMap = {
  profile: 'badge-primary', login: 'badge-success',
  error: 'badge-danger', security: 'badge-warning', register: 'badge-info',
};

export default function DashboardClient({ user }) {
  const { isDark, toggleTheme } = useTheme();
  const toast = useToast();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => signOut({ callbackUrl: '/login' });

  return (
    <div className={`app-layout ${isDark ? 'theme-dark' : 'theme-light'}`}>
      {/* Header */}
      <header className="app-header">
        <div className="app-header-left">
          <button
            className="icon-btn menu-toggle"
            onClick={() => setSidebarOpen(s => !s)}
            aria-label="Menú"
          >
            {sidebarOpen ? '✕' : '☰'}
          </button>
          <div className="app-brand" onClick={() => router.push('/dashboard')} role="button" tabIndex={0}>
            <span className="brand-logo">🔐</span>
            <span className="brand-name">UserHub</span>
          </div>
        </div>
        <nav className="app-header-right">
          <button className="icon-btn" onClick={toggleTheme} title="Cambiar tema">
            {isDark ? '☀️' : '🌙'}
          </button>
          <div className="user-menu">
            {user?.image ? (
              <Image
                src={user.image}
                alt={user.name ?? 'avatar'}
                width={36}
                height={36}
                className="user-avatar"
                style={{ borderRadius: '50%' }}
              />
            ) : (
              <div className="user-avatar">
                <span className="avatar-initials">
                  {(user?.name?.[0] ?? user?.email?.[0] ?? 'U').toUpperCase()}
                </span>
              </div>
            )}
            <div className="user-menu-details">
              <span className="user-menu-name">{user?.name ?? user?.email}</span>
              <span className="user-menu-role">{user?.role ?? 'Usuario'}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="btn-logout">
              Cerrar sesión
            </Button>
          </div>
        </nav>
      </header>

      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}

      <div className="app-main">
        {/* Sidebar */}
        <aside className={`app-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
          <ul className="sidebar-nav">
            {[
              { key: 'dashboard', label: 'Dashboard', icon: '📊', href: '/dashboard' },
              { key: 'profile', label: 'Mi Perfil', icon: '👤', href: '/profile' },
              { key: 'users', label: 'Usuarios', icon: '👥', href: '/users' },
              { key: 'settings', label: 'Ajustes', icon: '⚙️', href: '/settings' },
            ].map(item => (
              <li key={item.key}>
                <button
                  className={`sidebar-item ${item.key === 'dashboard' ? 'active' : ''}`}
                  onClick={() => { setSidebarOpen(false); router.push(item.href); }}
                >
                  <span className="sidebar-icon">{item.icon}</span>
                  <span className="sidebar-label">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="sidebar-footer"><div className="sidebar-version">v2.0.0</div></div>
        </aside>

        {/* Main content */}
        <main className="app-content">
          <div className="dashboard-view view">
            <header className="view-header">
              <div>
                <h1 className="view-title">Dashboard</h1>
                <p className="view-subtitle">
                  Bienvenido, {user?.name?.split(' ')[0] ?? 'Usuario'}. Este es el resumen del sistema.
                </p>
              </div>
              <div className="view-actions">
                <Button variant="outline" onClick={() => toast.info('Refrescando datos...', { title: 'Sincronización' })}>
                  🔄 Refrescar
                </Button>
                <Button variant="primary" onClick={() => toast.success('Reporte generado.', { title: 'Reporte' })}>
                  📥 Exportar
                </Button>
              </div>
            </header>

            <section className="stats-grid">
              {stats.map((s, i) => <StatCard key={i} {...s} />)}
            </section>

            <div className="dashboard-grid">
              <Card title="Actividad Reciente" subtitle="Últimos eventos del sistema" className="activity-card"
                headerRight={<Button variant="ghost" size="sm">Ver todo →</Button>}
              >
                <ul className="activity-list">
                  {recentActivity.map((item, idx) => (
                    <li key={idx} className="activity-item">
                      <div className="activity-avatar">
                        {item.user.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                      </div>
                      <div className="activity-body">
                        <p className="activity-user">
                          {item.user}{' '}
                          <span className={`badge ${badgeMap[item.type]}`}>{item.type}</span>
                        </p>
                        <p className="activity-action">{item.action}</p>
                      </div>
                      <span className="activity-time">{item.time}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card title="Mi Cuenta" subtitle="Resumen personal" className="account-card">
                <div className="account-summary">
                  <div className="account-avatar-lg">
                    {user?.image ? (
                      <Image src={user.image} alt="avatar" width={64} height={64} style={{ borderRadius: '50%' }} />
                    ) : (
                      (user?.name?.[0] ?? 'U').toUpperCase()
                    )}
                  </div>
                  <div className="account-info">
                    <h3 className="account-name">{user?.name}</h3>
                    <p className="account-email">{user?.email}</p>
                    <span className="badge badge-info account-badge">{user?.role ?? 'Usuario'}</span>
                    <span className="badge badge-success account-badge">
                      ✓ {user?.provider ?? 'oauth'} conectado
                    </span>
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
