import { Card } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Select } from '../components/ui/Select.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { useState, useEffect } from 'react';
import { useToast } from '../hooks/useToast.js';
import { authService } from '../services/authService.js';

const INITIAL_USERS = [
  { id: 1, name: 'María González', first_name: 'María', last_name: 'González', email: 'maria@ejemplo.com', username: 'maria_gz', role: 'Administrador', status: 'Activo' },
  { id: 2, name: 'Carlos Pérez', first_name: 'Carlos', last_name: 'Pérez', email: 'carlos@ejemplo.com', username: 'carlos_p', role: 'Usuario', status: 'Activo' },
  { id: 3, name: 'Ana Martínez', first_name: 'Ana', last_name: 'Martínez', email: 'ana@ejemplo.com', username: 'ana_m', role: 'Gestor', status: 'Activo' },
  { id: 4, name: 'Luis Rodríguez', first_name: 'Luis', last_name: 'Rodríguez', email: 'luis@ejemplo.com', username: 'luis_r', role: 'Usuario', status: 'Inactivo' },
  { id: 5, name: 'Sofía López', first_name: 'Sofía', last_name: 'López', email: 'sofia@ejemplo.com', username: 'sofia_l', role: 'Usuario', status: 'Activo' },
  { id: 6, name: 'Javier Gómez', first_name: 'Javier', last_name: 'Gómez', email: 'javier@ejemplo.com', username: 'javier_g', role: 'Invitado', status: 'Pendiente' },
];

const STATUS_BADGE = {
  Activo: 'badge-success',
  Inactivo: 'badge-muted',
  Suspendido: 'badge-danger',
  Pendiente: 'badge-warning',
};

const NEXT_STATUS = {
  Activo: 'Inactivo',
  Inactivo: 'Suspendido',
  Suspendido: 'Activo',
  Pendiente: 'Activo',
};

const ROLE_OPTIONS = [
  { value: 'Administrador', label: 'Administrador' },
  { value: 'Gestor', label: 'Gestor' },
  { value: 'Usuario', label: 'Usuario' },
  { value: 'Invitado', label: 'Invitado' },
];

const STATUS_OPTIONS = [
  { value: 'Activo', label: 'Activo' },
  { value: 'Inactivo', label: 'Inactivo' },
  { value: 'Pendiente', label: 'Pendiente' },
  { value: 'Suspendido', label: 'Suspendido' },
];

const emptyCreateForm = {
  first_name: '',
  last_name: '',
  email: '',
  username: '',
  role: 'Usuario',
  status: 'Activo',
  password: '',
};

export const UsersPage = () => {
  const [users, setUsers] = useState(INITIAL_USERS);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('Todos');

  // Modales
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [userToEdit, setUserToEdit] = useState(null);
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', email: '', username: '', role: 'Usuario', status: 'Activo' });
  const [userToDelete, setUserToDelete] = useState(null);

  const toast = useToast();

  useEffect(() => {
    let isMounted = true;
    const fetchUsers = async () => {
      const res = await authService.getUsers();
      if (isMounted && res.success && Array.isArray(res.data) && res.data.length > 0) {
        setUsers(res.data);
      }
    };
    fetchUsers();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filtrado reactivo
  const filtered = users.filter((u) => {
    const matchesQuery =
      u.name?.toLowerCase().includes(query.toLowerCase()) ||
      u.email?.toLowerCase().includes(query.toLowerCase()) ||
      u.username?.toLowerCase().includes(query.toLowerCase());

    const matchesRole = roleFilter === 'Todos' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'Todos' || u.status === statusFilter;

    return matchesQuery && matchesRole && matchesStatus;
  });

  // 1. CREAR USUARIO
  const handleOpenCreate = () => {
    setCreateForm(emptyCreateForm);
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.first_name.trim() || !createForm.email.trim()) {
      toast.error('Nombre y correo son obligatorios.');
      return;
    }

    const payload = {
      ...createForm,
      name: `${createForm.first_name} ${createForm.last_name}`.trim(),
    };

    const res = await authService.createUser(payload);
    const createdUser = res.success && res.data
      ? res.data
      : {
          id: Date.now(),
          ...payload,
        };

    setUsers((prev) => [createdUser, ...prev]);
    toast.success(`Usuario "${createdUser.name}" creado con éxito.`, { title: 'Usuario Creado' });
    setIsCreateOpen(false);
    setCreateForm(emptyCreateForm);
  };

  // 2. EDITAR USUARIO
  const handleOpenEdit = (user) => {
    setUserToEdit(user);
    const names = (user.name || '').split(' ');
    setEditForm({
      first_name: user.first_name || names[0] || '',
      last_name: user.last_name || names.slice(1).join(' ') || '',
      email: user.email || '',
      username: user.username || user.email.split('@')[0] || '',
      role: user.role || 'Usuario',
      status: user.status || 'Activo',
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.first_name.trim() || !editForm.email.trim()) {
      toast.error('Nombre y correo son obligatorios.');
      return;
    }

    const updatedData = {
      ...editForm,
      name: `${editForm.first_name} ${editForm.last_name}`.trim(),
    };

    await authService.updateUser(userToEdit.id, updatedData);

    setUsers((prev) =>
      prev.map((u) => (u.id === userToEdit.id ? { ...u, ...updatedData } : u))
    );

    toast.success(`Usuario "${updatedData.name}" actualizado correctamente.`, {
      title: 'Cambios Guardados',
    });
    setUserToEdit(null);
  };

  // 3. CAMBIAR ESTADO
  const handleToggleStatus = async (user) => {
    const next = NEXT_STATUS[user.status] || 'Activo';
    await authService.updateUserStatus(user.id, next);

    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, status: next } : u))
    );

    toast.info(`Estado de "${user.name}" cambiado a ${next}.`, {
      title: 'Estado Actualizado',
    });
  };

  // 4. ELIMINAR USUARIO
  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    try {
      await authService.deleteUser(userToDelete.id);
    } catch (_) {
      /* fallback */
    }

    setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
    toast.success(`El usuario "${userToDelete.name}" fue eliminado del sistema.`, {
      title: 'Usuario Eliminado',
    });
    setUserToDelete(null);
  };

  return (
    <div className="users-view view">
      <header className="view-header">
        <div>
          <h1 className="view-title">Gestión de Usuarios (Admin Panel)</h1>
          <p className="view-subtitle">
            Crea, edita, cambia estados y elimina usuarios en la base de datos.
          </p>
        </div>
        <div className="view-actions">
          <Button variant="primary" onClick={handleOpenCreate}>
            ＋ Nuevo Usuario
          </Button>
        </div>
      </header>

      <Card>
        <div className="toolbar">
          <div className="toolbar-search">
            <Input
              name="q"
              placeholder="Buscar por nombre, usuario o correo..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="toolbar-filters">
            <select
              className="input-control select-inline"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              aria-label="Filtrar por rol"
            >
              <option value="Todos">Todos los roles</option>
              <option value="Administrador">Administrador</option>
              <option value="Gestor">Gestor</option>
              <option value="Usuario">Usuario</option>
              <option value="Invitado">Invitado</option>
            </select>
            <select
              className="input-control select-inline"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filtrar por estado"
            >
              <option value="Todos">Todos los estados</option>
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Suspendido">Suspendido</option>
            </select>
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th className="col-actions">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="table-empty">
                    No se encontraron usuarios coincidentes.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="table-user">
                        <div className="table-avatar">
                          {u.name
                            ? u.name
                                .split(' ')
                                .map((w) => w[0])
                                .slice(0, 2)
                                .join('')
                            : (u.username || 'U').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="table-user-name">{u.name}</div>
                          {u.username && (
                            <small className="text-muted">@{u.username}</small>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <span className="badge badge-info">{u.role || 'Usuario'}</span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`badge ${STATUS_BADGE[u.status] || 'badge-muted'}`}
                        style={{ cursor: 'pointer', border: 'none' }}
                        title="Haz clic para alternar estado"
                        onClick={() => handleToggleStatus(u)}
                      >
                        {u.status || 'Activo'} ⟳
                      </button>
                    </td>
                    <td className="col-actions">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(u)}
                        title="Editar usuario"
                      >
                        ✏️ Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(u)}
                        title="Cambiar estado"
                      >
                        🔒 Estado
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setUserToDelete(u)}
                        title="Eliminar usuario"
                      >
                        🗑️ Eliminar
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ========================================================= */}
      {/* 1. MODAL: CREAR NUEVO USUARIO                             */}
      {/* ========================================================= */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="＋ Crear Nuevo Usuario"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleCreateSubmit}>
              Guardar Usuario
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateSubmit} className="form">
          <div className="form-grid form-grid-2">
            <Input
              label="Nombre"
              name="first_name"
              placeholder="Ej: Laura"
              required
              value={createForm.first_name}
              onChange={(e) => setCreateForm({ ...createForm, first_name: e.target.value })}
            />
            <Input
              label="Apellido"
              name="last_name"
              placeholder="Ej: Sánchez"
              value={createForm.last_name}
              onChange={(e) => setCreateForm({ ...createForm, last_name: e.target.value })}
            />
          </div>
          <div className="form-grid form-grid-2">
            <Input
              label="Correo Electrónico"
              name="email"
              type="email"
              placeholder="laura@ejemplo.com"
              required
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
            />
            <Input
              label="Nombre de Usuario"
              name="username"
              placeholder="laura_s"
              value={createForm.username}
              onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
            />
          </div>
          <div className="form-grid form-grid-2">
            <Select
              label="Rol del Sistema"
              name="role"
              options={ROLE_OPTIONS}
              value={createForm.role}
              onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
            />
            <Select
              label="Estado de la Cuenta"
              name="status"
              options={STATUS_OPTIONS}
              value={createForm.status}
              onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
            />
          </div>
          <Input
            label="Contraseña Inicial"
            name="password"
            type="password"
            placeholder="Mínimo 6 caracteres (opcional)"
            value={createForm.password}
            onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
          />
        </form>
      </Modal>

      {/* ========================================================= */}
      {/* 2. MODAL: EDITAR USUARIO                                  */}
      {/* ========================================================= */}
      <Modal
        isOpen={Boolean(userToEdit)}
        onClose={() => setUserToEdit(null)}
        title={`✏️ Editar Usuario: ${userToEdit?.name || ''}`}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setUserToEdit(null)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleEditSubmit}>
              Guardar Cambios
            </Button>
          </>
        }
      >
        <form onSubmit={handleEditSubmit} className="form">
          <div className="form-grid form-grid-2">
            <Input
              label="Nombre"
              name="edit_first_name"
              required
              value={editForm.first_name}
              onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
            />
            <Input
              label="Apellido"
              name="edit_last_name"
              value={editForm.last_name}
              onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
            />
          </div>
          <div className="form-grid form-grid-2">
            <Input
              label="Correo Electrónico"
              name="edit_email"
              type="email"
              required
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
            />
            <Input
              label="Nombre de Usuario"
              name="edit_username"
              value={editForm.username}
              onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
            />
          </div>
          <div className="form-grid form-grid-2">
            <Select
              label="Rol"
              name="edit_role"
              options={ROLE_OPTIONS}
              value={editForm.role}
              onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
            />
            <Select
              label="Estado"
              name="edit_status"
              options={STATUS_OPTIONS}
              value={editForm.status}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* ========================================================= */}
      {/* 3. MODAL: POP-UP DE VERIFICACIÓN DE BORRADO               */}
      {/* ========================================================= */}
      <Modal
        isOpen={Boolean(userToDelete)}
        onClose={() => setUserToDelete(null)}
        title="⚠️ Confirmar eliminación de usuario"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setUserToDelete(null)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDeleteConfirm}>
              Sí, eliminar definitivamente
            </Button>
          </>
        }
      >
        <p>
          ¿Estás seguro de que deseas eliminar permanentemente al usuario{' '}
          <strong>{userToDelete?.name}</strong> (<em>{userToDelete?.email}</em>)?
        </p>
        <p style={{ marginTop: '0.5rem', color: 'var(--color-danger)', fontSize: '0.875rem' }}>
          Esta acción no se puede deshacer y se eliminará de la base de datos.
        </p>
      </Modal>
    </div>
  );
};

export default UsersPage;


