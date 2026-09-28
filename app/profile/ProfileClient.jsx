'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../hooks/useToast';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';

const timezoneOptions = [
  { value: 'UTC', label: '(UTC+00:00) UTC' },
  { value: 'America/Argentina/Buenos_Aires', label: '(UTC-03:00) Buenos Aires' },
  { value: 'America/Mexico_City', label: '(UTC-06:00) Ciudad de México' },
  { value: 'America/Bogota', label: '(UTC-05:00) Bogotá' },
  { value: 'Europe/Madrid', label: '(UTC+01:00) Madrid' },
];

const navItems = [
  { key: 'dashboard', label: 'Dashboard', icon: '📊', href: '/dashboard' },
  { key: 'profile', label: 'Mi Perfil', icon: '👤', href: '/profile' },
  { key: 'users', label: 'Usuarios', icon: '👥', href: '/users' },
  { key: 'settings', label: 'Ajustes', icon: '⚙️', href: '/settings' },
];

export default function ProfileClient({ user }) {
  const { isDark, toggleTheme } = useTheme();
  const toast = useToast();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: user?.first_name ?? '',
    last_name: user?.last_name ?? '',
    phone_number: '',
    timezone: 'America/Argentina/Buenos_Aires',
    locale: 'es',
    biography: '',
  });

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/profile/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Perfil actualizado correctamente.', { title: '¡Guardado!' });
      } else {
        toast.error(data.message ?? 'No se pudo actualizar.', { title: 'Error' });
      }
    } catch {
      toast.error('Error de conexión.', { title: 'Error' });
    } finally {
      setSaving(false);
    }
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
              <span className="avatar-initials">
                {(user?.name?.[0] ?? 'U').toUpperCase()}
              </span>
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
                  className={`sidebar-item ${item.key === 'profile' ? 'active' : ''}`}
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
          <div className="profile-view view">
            <header className="view-header">
              <div>
                <h1 className="view-title">Mi Perfil</h1>
                <p className="view-subtitle">Gestiona tus datos personales.</p>
              </div>
            </header>

            <div className="profile-grid">
              <Card title="Información Personal" subtitle="Datos básicos de tu cuenta">
                {/* Info de provider */}
                <div className="form-alert" style={{ marginBottom: '1rem', background: 'var(--color-primary-soft)', color: 'var(--color-primary)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem' }}>
                  ✅ Cuenta vinculada con <strong>{user?.provider ?? 'OAuth'}</strong>
                  {user?.email && <> — {user.email}</>}
                </div>

                <form className="form" onSubmit={handleSave} noValidate>
                  <div className="form-grid form-grid-2">
                    <div className="form-field">
                      <label className="form-label">Nombre</label>
                      <input name="first_name" className="input-control" value={form.first_name} onChange={handleChange} disabled={saving} />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Apellido</label>
                      <input name="last_name" className="input-control" value={form.last_name} onChange={handleChange} disabled={saving} />
                    </div>
                  </div>
                  <div className="form-grid form-grid-2">
                    <div className="form-field">
                      <label className="form-label">Teléfono</label>
                      <input name="phone_number" className="input-control" placeholder="+54 9 11 0000 0000" value={form.phone_number} onChange={handleChange} disabled={saving} />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Zona Horaria</label>
                      <select name="timezone" className="select-control" value={form.timezone} onChange={handleChange} disabled={saving}>
                        {timezoneOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-field">
                    <label className="form-label">Biografía</label>
                    <textarea name="biography" className="input-control textarea-control" rows={4} placeholder="Cuéntanos sobre ti..." value={form.biography} onChange={handleChange} disabled={saving} />
                    <p className="form-message form-helper">{form.biography.length}/500 caracteres</p>
                  </div>
                  <div className="form-actions form-actions-right">
                    <Button type="submit" variant="primary" loading={saving} disabled={saving}>
                      Guardar cambios
                    </Button>
                  </div>
                </form>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
