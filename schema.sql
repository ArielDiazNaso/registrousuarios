-- ============================================================
-- SISTEMA DE GESTIÓN DE USUARIOS - ESQUEMA SQL NORMALIZADO 3NF
-- ============================================================

-- Eliminación condicional de tablas existentes (orden inverso a dependencias FK)
DROP TABLE IF EXISTS user_audit_logs;
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS user_role_permissions;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS account_status_history;
DROP TABLE IF EXISTS user_profiles;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS account_statuses;
DROP TABLE IF EXISTS audit_actions;

-- ============================================================
-- TABLAS MAESTRAS / DE REFERENCIA (Sin dependencias FK)
-- ============================================================

CREATE TABLE account_statuses (
    status_id       SERIAL PRIMARY KEY,
    status_code     VARCHAR(20)  NOT NULL UNIQUE,
    status_name     VARCHAR(50)  NOT NULL UNIQUE,
    description     TEXT,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE roles (
    role_id         SERIAL PRIMARY KEY,
    role_code       VARCHAR(30)  NOT NULL UNIQUE,
    role_name       VARCHAR(50)  NOT NULL UNIQUE,
    description     TEXT,
    is_assignable   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE permissions (
    permission_id   SERIAL PRIMARY KEY,
    permission_code VARCHAR(50)  NOT NULL UNIQUE,
    permission_name VARCHAR(100) NOT NULL UNIQUE,
    module          VARCHAR(50)  NOT NULL,
    description     TEXT,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_actions (
    action_id       SERIAL PRIMARY KEY,
    action_code     VARCHAR(30)  NOT NULL UNIQUE,
    action_name     VARCHAR(100) NOT NULL UNIQUE,
    category        VARCHAR(30)  NOT NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLA PRINCIPAL: USUARIOS (Users)
-- 3NF: Datos de autenticación separados de datos de perfil
-- ============================================================

CREATE TABLE users (
    user_id            SERIAL PRIMARY KEY,
    email              VARCHAR(255)  NOT NULL UNIQUE,
    username           VARCHAR(50)   NOT NULL UNIQUE,
    password_hash      VARCHAR(255)  NOT NULL,
    password_salt      VARCHAR(100),
    failed_login_attempts INT        NOT NULL DEFAULT 0,
    last_failed_login  TIMESTAMP,
    password_changed_at TIMESTAMP,
    email_verified     BOOLEAN       NOT NULL DEFAULT FALSE,
    email_verified_at  TIMESTAMP,
    status_id          INT           NOT NULL DEFAULT 1,
    created_at         TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_users_status
        FOREIGN KEY (status_id) REFERENCES account_statuses(status_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT check_email_format
        CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),

    CONSTRAINT check_username_length
        CHECK (LENGTH(username) >= 3 AND LENGTH(username) <= 50),

    CONSTRAINT check_password_hash_not_empty
        CHECK (LENGTH(password_hash) > 0)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_status ON users(status_id);
CREATE INDEX idx_users_created ON users(created_at);

-- ============================================================
-- TABLA: PERFILES DE USUARIO (User Profiles)
-- 3NF: Separación de datos de identidad personal de credenciales
-- ============================================================

CREATE TABLE user_profiles (
    profile_id      SERIAL PRIMARY KEY,
    user_id         INT          NOT NULL UNIQUE,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    phone_number    VARCHAR(20),
    date_of_birth   DATE,
    avatar_url      VARCHAR(500),
    timezone        VARCHAR(50)  DEFAULT 'UTC',
    locale          VARCHAR(10)  DEFAULT 'es',
    biography       TEXT,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_user_profiles_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT check_first_name_not_empty
        CHECK (LENGTH(TRIM(first_name)) > 0),

    CONSTRAINT check_last_name_not_empty
        CHECK (LENGTH(TRIM(last_name)) > 0),

    CONSTRAINT check_phone_format
        CHECK (phone_number IS NULL OR phone_number ~* '^[+0-9\s\-()]{7,20}$')
);

CREATE INDEX idx_user_profiles_name ON user_profiles(last_name, first_name);

-- ============================================================
-- TABLA: ROLES DE USUARIO (User Roles - N:M)
-- ============================================================

CREATE TABLE user_roles (
    user_role_id    SERIAL PRIMARY KEY,
    user_id         INT       NOT NULL,
    role_id         INT       NOT NULL,
    assigned_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    assigned_by     INT,
    is_primary      BOOLEAN   NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_user_roles_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT fk_user_roles_role
        FOREIGN KEY (role_id) REFERENCES roles(role_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT fk_user_roles_assigned_by
        FOREIGN KEY (assigned_by) REFERENCES users(user_id)
        ON DELETE SET NULL ON UPDATE CASCADE,

    CONSTRAINT uq_user_role_unique
        UNIQUE (user_id, role_id)
);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);

-- ============================================================
-- TABLA: PERMISOS POR ROL (Role Permissions - N:M)
-- ============================================================

CREATE TABLE role_permissions (
    role_permission_id SERIAL PRIMARY KEY,
    role_id            INT       NOT NULL,
    permission_id      INT       NOT NULL,
    granted_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_role_permissions_role
        FOREIGN KEY (role_id) REFERENCES roles(role_id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT fk_role_permissions_permission
        FOREIGN KEY (permission_id) REFERENCES permissions(permission_id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT uq_role_permission_unique
        UNIQUE (role_id, permission_id)
);

CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);

-- ============================================================
-- VISTA: USUARIOS CON ROL Y PERMISOS EFECTIVOS (Denormalizada para consultas)
-- ============================================================

CREATE OR REPLACE VIEW v_user_role_permissions AS
SELECT
    u.user_id,
    u.email,
    u.username,
    u.status_id,
    ast.status_code AS account_status,
    r.role_id,
    r.role_code,
    r.role_name,
    p.permission_id,
    p.permission_code,
    p.module
FROM users u
INNER JOIN account_statuses ast  ON u.status_id = ast.status_id
LEFT  JOIN user_roles ur         ON u.user_id  = ur.user_id
LEFT  JOIN roles r               ON ur.role_id = r.role_id
LEFT  JOIN role_permissions rp   ON r.role_id  = rp.role_id
LEFT  JOIN permissions p         ON rp.permission_id = p.permission_id;

-- ============================================================
-- TABLA: SESIONES DE USUARIO (User Sessions)
-- ============================================================

CREATE TABLE user_sessions (
    session_id      SERIAL PRIMARY KEY,
    user_id         INT          NOT NULL,
    session_token   VARCHAR(255) NOT NULL UNIQUE,
    refresh_token   VARCHAR(255) UNIQUE,
    ip_address      INET,
    user_agent      TEXT,
    device_info     JSONB,
    expires_at      TIMESTAMP    NOT NULL,
    last_activity   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_at      TIMESTAMP,

    CONSTRAINT fk_user_sessions_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX idx_user_sessions_user    ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token   ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_active  ON user_sessions(is_active, expires_at);

-- ============================================================
-- TABLA: HISTÓRICO DE ESTADOS DE CUENTA (Account Status History)
-- ============================================================

CREATE TABLE account_status_history (
    history_id      SERIAL PRIMARY KEY,
    user_id         INT       NOT NULL,
    old_status_id   INT,
    new_status_id   INT       NOT NULL,
    changed_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    changed_by      INT,
    change_reason   VARCHAR(255),

    CONSTRAINT fk_account_status_history_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT fk_account_status_history_old
        FOREIGN KEY (old_status_id) REFERENCES account_statuses(status_id)
        ON DELETE SET NULL ON UPDATE CASCADE,

    CONSTRAINT fk_account_status_history_new
        FOREIGN KEY (new_status_id) REFERENCES account_statuses(status_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT fk_account_status_history_changed_by
        FOREIGN KEY (changed_by) REFERENCES users(user_id)
        ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX idx_account_status_history_user ON account_status_history(user_id);
CREATE INDEX idx_account_status_history_date ON account_status_history(changed_at DESC);

-- ============================================================
-- TABLA: LOGS DE AUDITORÍA (User Audit Logs)
-- ============================================================

CREATE TABLE user_audit_logs (
    audit_id        BIGSERIAL PRIMARY KEY,
    user_id         INT,
    action_id       INT          NOT NULL,
    session_id      INT,
    ip_address      INET,
    affected_user_id INT,
    old_data        JSONB,
    new_data        JSONB,
    request_path    VARCHAR(255),
    user_agent      TEXT,
    occurred_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_logs_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE SET NULL ON UPDATE CASCADE,

    CONSTRAINT fk_audit_logs_action
        FOREIGN KEY (action_id) REFERENCES audit_actions(action_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT fk_audit_logs_session
        FOREIGN KEY (session_id) REFERENCES user_sessions(session_id)
        ON DELETE SET NULL ON UPDATE CASCADE,

    CONSTRAINT fk_audit_logs_affected
        FOREIGN KEY (affected_user_id) REFERENCES users(user_id)
        ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX idx_audit_logs_user     ON user_audit_logs(user_id, occurred_at DESC);
CREATE INDEX idx_audit_logs_action   ON user_audit_logs(action_id, occurred_at DESC);
CREATE INDEX idx_audit_logs_occurred ON user_audit_logs(occurred_at DESC);

-- ============================================================
-- TRIGGER: Actualización automática de updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql VOLATILE;

CREATE TRIGGER trg_account_statuses_updated
    BEFORE UPDATE ON account_statuses
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_roles_updated
    BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_permissions_updated
    BEFORE UPDATE ON permissions
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_users_updated
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE TRIGGER trg_user_profiles_updated
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ============================================================
-- DATOS SEMILLA (Seed Data) - Roles, Permisos, Estados, Acciones
-- ============================================================

INSERT INTO account_statuses (status_code, status_name, description) VALUES
    ('ACTIVE',    'Activo',          'Cuenta operativa y habilitada'),
    ('INACTIVE',  'Inactivo',        'Cuenta desactivada temporalmente'),
    ('SUSPENDED', 'Suspendido',      'Cuenta suspendida por violación de políticas'),
    ('BANNED',    'Bloqueado',       'Cuenta bloqueada permanentemente'),
    ('PENDING',   'Pendiente',       'Cuenta creada, pendiente de verificación');

INSERT INTO roles (role_code, role_name, description, is_assignable) VALUES
    ('SUPER_ADMIN', 'Super Administrador', 'Control total del sistema (no asignable desde UI)', FALSE),
    ('ADMIN',       'Administrador',       'Gestión de usuarios, roles y configuraciones', TRUE),
    ('MANAGER',     'Gestor',              'Visualización de reportes y gestión de equipo', TRUE),
    ('USER',        'Usuario Estándar',    'Permisos básicos de usuario autenticado', TRUE),
    ('GUEST',       'Invitado',            'Acceso de solo lectura', TRUE);

INSERT INTO permissions (permission_code, permission_name, module) VALUES
    ('users.read',        'Ver usuarios',           'users'),
    ('users.create',      'Crear usuarios',         'users'),
    ('users.update',      'Actualizar usuarios',    'users'),
    ('users.delete',      'Eliminar usuarios',      'users'),
    ('roles.read',        'Ver roles',              'roles'),
    ('roles.assign',      'Asignar roles',          'roles'),
    ('profile.read',      'Ver perfil propio',      'profile'),
    ('profile.update',    'Actualizar perfil',      'profile'),
    ('system.settings',   'Configurar sistema',     'system'),
    ('audit.read',        'Ver logs de auditoría',  'audit'),
    ('sessions.manage',   'Gestionar sesiones',     'sessions');

INSERT INTO audit_actions (action_code, action_name, category) VALUES
    ('LOGIN_SUCCESS',  'Inicio de sesión exitoso',    'authentication'),
    ('LOGIN_FAILURE',  'Fallo en inicio de sesión',   'authentication'),
    ('LOGOUT',         'Cierre de sesión',            'authentication'),
    ('REGISTER',       'Registro de usuario',         'account'),
    ('PASSWORD_RESET', 'Restablecimiento de contraseña', 'account'),
    ('EMAIL_VERIFY',   'Verificación de correo',      'account'),
    ('STATUS_CHANGE',  'Cambio de estado de cuenta',  'account'),
    ('PROFILE_UPDATE', 'Actualización de perfil',     'profile'),
    ('ROLE_ASSIGN',    'Asignación de rol',           'permissions'),
    ('SESSION_CREATE', 'Creación de sesión',          'sessions'),
    ('SESSION_REVOKE', 'Revocación de sesión',        'sessions');

-- Rol Super Admin con TODOS los permisos
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.role_code = 'SUPER_ADMIN';

-- Rol Admin: casi todos los permisos excepto system.settings
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.role_code = 'ADMIN'
  AND p.permission_code <> 'system.settings';

-- Rol Manager: permisos de lectura + gestión básica
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.role_code = 'MANAGER'
  AND p.permission_code IN ('users.read', 'profile.read', 'profile.update', 'audit.read');

-- Rol User: solo perfil propio
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.role_code = 'USER'
  AND p.permission_code IN ('profile.read', 'profile.update');

-- Rol Guest: solo lectura de perfil
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.role_code = 'GUEST'
  AND p.permission_code = 'profile.read';
