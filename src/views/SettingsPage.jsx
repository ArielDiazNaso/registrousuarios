import { Card } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { ThemeToggle } from '../components/ui/ThemeToggle.jsx';
import { Select } from '../components/ui/Select.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { useState } from 'react';
import { useToast } from '../hooks/useToast.js';
import { useAuth } from '../hooks/useAuth.js';

export const SettingsPage = () => {
  const toast = useToast();
  const { hasRole, logout } = useAuth();
  const [lang, setLang] = useState('es');
  const [tz, setTz] = useState('UTC');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const isAdmin = hasRole('SUPER_ADMIN') || hasRole('ADMIN');

  const notifyOpts = [
    { key: 'emails', label: 'Notificaciones por email', desc: 'Recibe actualizaciones importantes en tu bandeja.', defaultChecked: true },
    { key: 'push', label: 'Notificaciones push', desc: 'Alertas en tiempo real en tu dispositivo.', defaultChecked: true },
    { key: 'marketing', label: 'Comunicaciones de producto', desc: 'Nuevas características y mejoras.', defaultChecked: false },
  ];

  return (
    <div className="settings-view view">
      <header className="view-header">
        <div>
          <h1 className="view-title">Ajustes</h1>
          <p className="view-subtitle">Personaliza tu experiencia en el sistema.</p>
        </div>
      </header>

      <div className="settings-grid">
        <Card title="Apariencia" subtitle="Tema y preferencias visuales">
          <div className="settings-row">
            <div className="settings-info">
              <h4 className="settings-name">Tema de la interfaz</h4>
              <p className="settings-desc">Elige entre modo claro u oscuro.</p>
            </div>
            <ThemeToggle showLabel />
          </div>
          <div className="settings-row">
            <div className="settings-info">
              <h4 className="settings-name">Idioma preferido</h4>
              <p className="settings-desc">Idioma de la interfaz de usuario.</p>
            </div>
            <Select
              name="lang"
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              options={[
                { value: 'es', label: 'Español' },
                { value: 'en', label: 'English' },
                { value: 'pt', label: 'Português' },
              ]}
            />
          </div>
          <div className="settings-row">
            <div className="settings-info">
              <h4 className="settings-name">Zona horaria</h4>
              <p className="settings-desc">Usada para mostrar fechas y horas.</p>
            </div>
            <Select
              name="tz"
              value={tz}
              onChange={(e) => setTz(e.target.value)}
              options={[
                { value: 'UTC', label: 'UTC (Universal)' },
                { value: 'America/Bogota', label: 'Bogotá, Lima, Quito' },
                { value: 'America/Mexico_City', label: 'Ciudad de México' },
                { value: 'Europe/Madrid', label: 'Madrid' },
              ]}
            />
          </div>
        </Card>

        <Card title="Notificaciones" subtitle="Controla qué alertas recibir">
          <ul className="toggle-list">
            {notifyOpts.map((opt) => (
              <li key={opt.key} className="toggle-row">
                <div className="toggle-info">
                  <h4 className="toggle-name">{opt.label}</h4>
                  <p className="toggle-desc">{opt.desc}</p>
                </div>
                <label className="switch">
                  <input type="checkbox" defaultChecked={opt.defaultChecked} />
                  <span className="switch-slider" />
                </label>
              </li>
            ))}
          </ul>
        </Card>

        {isAdmin && (
          <Card
            title="Ajustes del Sistema"
            subtitle="Solo administradores"
            className="admin-settings"
          >
            <div className="settings-row">
              <div className="settings-info">
                <h4 className="settings-name">Registro abierto</h4>
                <p className="settings-desc">Permite a nuevos usuarios crear cuentas sin invitación.</p>
              </div>
              <label className="switch">
                <input type="checkbox" defaultChecked />
                <span className="switch-slider" />
              </label>
            </div>
            <div className="settings-row">
              <div className="settings-info">
                <h4 className="settings-name">Verificación de email</h4>
                <p className="settings-desc">Obliga a verificar el correo antes del primer acceso.</p>
              </div>
              <label className="switch">
                <input type="checkbox" defaultChecked />
                <span className="switch-slider" />
              </label>
            </div>
            <div className="form-actions form-actions-right">
              <Button variant="primary" onClick={() => toast.success('Ajustes guardados.', { title: 'Sistema' })}>
                Guardar ajustes de sistema
              </Button>
            </div>
          </Card>
        )}

        <Card
          title="Zona de Peligro"
          subtitle="Acciones destructivas, por favor ten cuidado"
          className="danger-card"
        >
          <div className="danger-actions">
            <div className="danger-item">
              <h4>Cerrar todas las sesiones activas</h4>
              <p>Invalidarás tus credenciales en todos los dispositivos. Tendrás que volver a iniciar sesión aquí.</p>
              <Button
                variant="outline"
                onClick={() => toast.warning('Sesiones cerradas (demo).', { title: 'Seguridad' })}
              >
                Cerrar sesiones
              </Button>
            </div>
            <div className="danger-item danger-item-severe">
              <h4>Eliminar mi cuenta permanentemente</h4>
              <p>Esta acción no se puede deshacer. Todos tus datos serán eliminados del sistema.</p>
              <Button
                variant="danger"
                onClick={() => setIsDeleteModalOpen(true)}
              >
                Eliminar cuenta
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Modal pop-up para verificación de eliminación de cuenta */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="⚠️ Confirmar eliminación definitiva de cuenta"
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                setIsDeleteModalOpen(false);
                toast.success('Tu cuenta ha sido eliminada permanentemente.', {
                  title: 'Cuenta Eliminada',
                });
                await logout();
              }}
            >
              Sí, eliminar definitivamente
            </Button>
          </>
        }
      >
        <p>
          ¿Estás seguro de que deseas eliminar tu cuenta permanentemente?
        </p>
        <p style={{ marginTop: '0.5rem', color: 'var(--color-danger)', fontSize: '0.875rem' }}>
          Esta acción es destructiva e irreversible. Todos tus datos, sesiones y accesos serán borrados del sistema.
        </p>
      </Modal>
    </div>
  );
};

export default SettingsPage;
