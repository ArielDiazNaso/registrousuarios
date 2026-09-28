'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../hooks/useToast';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { Modal } from '../../src/components/ui/Modal';

const STATUS_BADGE = { ACTIVE: 'badge-success', INACTIVE: 'badge-muted', SUSPENDED: 'badge-danger', PENDING: 'badge-warning' };
const ROLE_OPTIONS = ['USER', 'ADMIN', 'SUPER_ADMIN'];
const STATUS_OPTIONS = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING'];
const navItems = [
  { key: 'dashboard', label: 'Dashboard', icon: '📊', href: '/dashboard' },
  { key: 'profile', label: 'Mi Perfil', icon: '👤', href: '/profile' },
  { key: 'users', label: 'Usuarios', icon: '👥', href: '/users' },
  { key: 'settings', label: 'Ajustes', icon: '⚙️', href: '/settings' },
];

export default function UsersClient({ currentUser }) {
  const { isDark, toggleTheme } = useTheme();
  const toast = useToast();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [userToDelete, setUserToDelete] = useState(null);
  const [userToEdit, setUserToEdit] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: 'USER', status: 'ACTIVE' });
  const [saving, setSaving] = useState(false);
  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';

  useEffect(() => {
    fetch('/api/users')
      .then(r => r.json())
      .then(data => {
        if (data.success) setUsers(data.data);
      })
      .catch(() => toast.error('No se pudieron cargar los usuarios.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(u =>
    !query || u.name?.toLowerCase().includes(query.toLowerCase()) || u.email?.toLowerCase().includes(query.toLowerCase())
  );

  const handleDelete = async () => {
    if (!userToDelete) return;
    try {
      const res = await fetch(`/api/users/${userToDelete.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setUsers(u => u.filter(x => x.id !== userToDelete.id));
        toast.success('Usuario eliminado.', { title: 'Eliminado' });
      } else {
        toast.error(data.message, { title: 'Error' });
      }
    } catch {
      toast.error('Error de conexión.', { title: 'Error' });
    }
    setUserToDelete(null);
  };

  const handleEditSave = async () => {
    if (!userToEdit) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${userToEdit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.success) {
        setUsers(u => u.map(x => x.id === userToEdit.id ? { ...x, ...editForm } : x));
        toast.success('Usuario actualizado.', { title: '¡Guardado!' });
        setUserToEdit(null);
      } else {
        toast.error(data.message, { title: 'Error' });
      }
    } catch {
      toast.error('Error de conexión.', { title: 'Error' });
    }
    setSaving(false);
  };

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
              <span className="avatar-initials">{(currentUser?.name?.[0] ?? 'U').toUpperCase()}</span>
            </div>
            <div className="user-menu-details">
              <span className="user-menu-name">{currentUser?.name}</span>
              <span className="user-menu-role">{currentUser?.role ?? 'Usuario'}</span>
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
                  className={`sidebar-item ${item.key === 'users' ? 'active' : ''}`}
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
          <div className="users-view view">
            <header className="view-header">
              <div>
                <h1 className="view-title">Usuarios</h1>
                <p className="view-subtitle">Gestión de usuarios registrados via OAuth.</p>
              </div>
            </header>

            {!isAdmin && (
              <div className="form-alert form-alert-warning">
                ⚠️ Solo tenés acceso de lectura. Se necesita rol ADMIN para editar o eliminar.
              </div>
            )}

            <Card>
              <div style={{ marginBottom: '1rem' }}>
                <input
                  className="input-control"
                  placeholder="Buscar por nombre o email..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                />
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                  Cargando usuarios...
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                  No hay usuarios registrados aún.
                </div>
              ) : (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Usuario</th>
                        <th>Email</th>
                        <th>Provider</th>
                        <th>Rol</th>
                        <th>Estado</th>
                        {isAdmin && <th>Acciones</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(u => (
                        <tr key={u.id}>
                          <td>
                            <div className="user-cell">
                              <div className="user-cell-avatar">
                                {(u.name?.[0] ?? u.email?.[0] ?? '?').toUpperCase()}
                              </div>
                              <div>
                                <p className="user-cell-name">{u.name ?? '—'}</p>
                                <p className="user-cell-meta">ID: {u.id}</p>
                              </div>
                            </div>
                          </td>
                          <td>{u.email}</td>
                          <td>
                            <span className="badge badge-info">{u.provider ?? 'oauth'}</span>
                          </td>
                          <td>
                            <span className="badge badge-primary">{u.role}</span>
                          </td>
                          <td>
                            <span className={`badge ${STATUS_BADGE[u.status] ?? 'badge-muted'}`}>
                              {u.status}
                            </span>
                          </td>
                          {isAdmin && (
                            <td>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <Button size="sm" variant="outline" onClick={() => {
                                  setUserToEdit(u);
                                  setEditForm({ name: u.name, email: u.email, role: u.role, status: u.status });
                                }}>
                                  ✏️
                                </Button>
                                <Button size="sm" variant="danger" onClick={() => setUserToDelete(u)}>
                                  🗑️
                                </Button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </main>
      </div>

      {/* Modal editar */}
      {userToEdit && (
        <Modal isOpen onClose={() => setUserToEdit(null)} title="Editar Usuario" size="sm">
          <div className="form">
            <div className="form-field">
              <label className="form-label">Nombre</label>
              <input className="input-control" value={editForm.name ?? ''} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="form-field">
              <label className="form-label">Rol</label>
              <select className="select-control" value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}>
                {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Estado</label>
              <select className="select-control" value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-actions form-actions-right">
              <Button variant="ghost" onClick={() => setUserToEdit(null)}>Cancelar</Button>
              <Button variant="primary" loading={saving} onClick={handleEditSave}>Guardar</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal eliminar */}
      {userToDelete && (
        <Modal isOpen onClose={() => setUserToDelete(null)} title="Confirmar eliminación" size="sm">
          <p>¿Estás seguro que querés eliminar a <strong>{userToDelete.name ?? userToDelete.email}</strong>?</p>
          <div className="form-actions form-actions-right" style={{ marginTop: '1.5rem' }}>
            <Button variant="ghost" onClick={() => setUserToDelete(null)}>Cancelar</Button>
            <Button variant="danger" onClick={handleDelete}>Eliminar</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
