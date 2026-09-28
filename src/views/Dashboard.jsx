import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../hooks/useToast.js';
import { Card, StatCard } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';

export const Dashboard = () => {
  const { user, hasPermission, hasRole } = useAuth();
  const toast = useToast();

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

  const getActionColor = (type) => {
    const map = {
      profile: 'badge-primary',
      login: 'badge-success',
      error: 'badge-danger',
      security: 'badge-warning',
      register: 'badge-info',
    };
    return map[type] || 'badge-primary';
  };

  return (
    <div className="dashboard-view view">
      <header className="view-header">
        <div>
          <h1 className="view-title">Dashboard</h1>
          <p className="view-subtitle">
            Bienvenido, {user?.first_name || 'Usuario'}. Este es el resumen general del sistema.
          </p>
        </div>
        <div className="view-actions">
          <Button
            variant="outline"
            onClick={() => toast.info('Refrescando datos...', { title: 'Sincronización' })}
          >
            🔄 Refrescar
          </Button>
          <Button
            variant="primary"
            onClick={() => toast.success('Reporte generado correctamente.', { title: 'Reporte' })}
          >
            📥 Exportar
          </Button>
        </div>
      </header>

      <section className="stats-grid" aria-label="Estadísticas del sistema">
        {stats.map((s, i) => (
          <StatCard key={i} {...s} />
        ))}
      </section>

      <div className="dashboard-grid">
        <Card
          title="Actividad Reciente"
          subtitle="Últimos eventos del sistema"
          className="activity-card"
          headerRight={
            <Button variant="ghost" size="sm" onClick={() => toast.info('Vista detalle próximamente.')}>
              Ver todo →
            </Button>
          }
        >
          <ul className="activity-list">
            {recentActivity.map((item, idx) => (
              <li key={idx} className="activity-item">
                <div className="activity-avatar">
                  {item.user
                    .split(' ')
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </div>
                <div className="activity-body">
                  <p className="activity-user">
                    {item.user}{' '}
                    <span className={`badge ${getActionColor(item.type)}`}>{item.type}</span>
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
              {(user?.first_name?.[0] || 'U').toUpperCase()}
              {(user?.last_name?.[0] || '').toUpperCase()}
            </div>
            <div className="account-info">
              <h3 className="account-name">
                {user?.first_name} {user?.last_name}
              </h3>
              <p className="account-email">{user?.email}</p>
              <span className="badge badge-info account-badge">
                {user?.role?.role_name || 'Usuario'}
              </span>
              {user?.email_verified ? (
                <span className="badge badge-success account-badge">✓ Email verificado</span>
              ) : (
                <span className="badge badge-warning account-badge">⚠ Email pendiente</span>
              )}
            </div>
          </div>
          <div className="account-permissions">
            <h4>Permisos asignados</h4>
            <ul className="perm-list">
              {(user?.permissions || []).length === 0 ? (
                <li className="perm-empty">Sin permisos explícitos.</li>
              ) : (
                (user?.permissions || []).map((p) => (
                  <li key={p} className="perm-item">
                    <span className="perm-check">✓</span> {p}
                  </li>
                ))
              )}
            </ul>
          </div>
          {(hasPermission('system.settings') || hasRole('SUPER_ADMIN')) && (
            <div className="admin-banner">
              <span className="admin-icon">👑</span>
              <span>Tienes privilegios de administrador.</span>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
