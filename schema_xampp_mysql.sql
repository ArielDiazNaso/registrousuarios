-- ============================================================
-- USERHUB - SISTEMA DE GESTIÓN DE USUARIOS
-- BASE DE DATOS LOCAL MYSQL / MARIADB PARA XAMPP (phpMyAdmin)
-- ============================================================

-- 1. Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS `userhub_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `userhub_db`;

-- Desactivar temporalmente revisión de claves foráneas para recrear tablas limpiamente
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `user_audit_logs`;
DROP TABLE IF EXISTS `user_sessions`;
DROP TABLE IF EXISTS `account_status_history`;
DROP TABLE IF EXISTS `role_permissions`;
DROP TABLE IF EXISTS `user_roles`;
DROP TABLE IF EXISTS `permissions`;
DROP TABLE IF EXISTS `user_profiles`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `roles`;
DROP TABLE IF EXISTS `account_statuses`;
DROP TABLE IF EXISTS `audit_actions`;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- 2. TABLAS MAESTRAS (Estados, Roles, Permisos, Acciones)
-- ============================================================

CREATE TABLE `account_statuses` (
  `status_id` INT AUTO_INCREMENT PRIMARY KEY,
  `status_code` VARCHAR(20) NOT NULL UNIQUE,
  `status_name` VARCHAR(50) NOT NULL UNIQUE,
  `description` TEXT,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `roles` (
  `role_id` INT AUTO_INCREMENT PRIMARY KEY,
  `role_code` VARCHAR(30) NOT NULL UNIQUE,
  `role_name` VARCHAR(50) NOT NULL UNIQUE,
  `description` TEXT,
  `is_assignable` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `permissions` (
  `permission_id` INT AUTO_INCREMENT PRIMARY KEY,
  `permission_code` VARCHAR(50) NOT NULL UNIQUE,
  `permission_name` VARCHAR(100) NOT NULL UNIQUE,
  `module` VARCHAR(50) NOT NULL,
  `description` TEXT,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `audit_actions` (
  `action_id` INT AUTO_INCREMENT PRIMARY KEY,
  `action_code` VARCHAR(30) NOT NULL UNIQUE,
  `action_name` VARCHAR(100) NOT NULL UNIQUE,
  `category` VARCHAR(30) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. TABLA PRINCIPAL DE USUARIOS
-- ============================================================

CREATE TABLE `users` (
  `user_id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `failed_login_attempts` INT NOT NULL DEFAULT 0,
  `last_failed_login` TIMESTAMP NULL DEFAULT NULL,
  `password_changed_at` TIMESTAMP NULL DEFAULT NULL,
  `email_verified` TINYINT(1) NOT NULL DEFAULT 0,
  `status_id` INT NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_users_status` FOREIGN KEY (`status_id`)
    REFERENCES `account_statuses` (`status_id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. TABLA PERFILES DE USUARIO (3NF)
-- ============================================================

CREATE TABLE `user_profiles` (
  `profile_id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL UNIQUE,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `phone_number` VARCHAR(20) DEFAULT NULL,
  `date_of_birth` DATE DEFAULT NULL,
  `avatar_url` VARCHAR(500) DEFAULT NULL,
  `timezone` VARCHAR(50) DEFAULT 'UTC',
  `locale` VARCHAR(10) DEFAULT 'es',
  `biography` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_user_profiles_user` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`user_id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. RELACIONES N:M (Roles y Permisos)
-- ============================================================

CREATE TABLE `user_roles` (
  `user_role_id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `role_id` INT NOT NULL,
  `assigned_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_primary` TINYINT(1) NOT NULL DEFAULT 0,
  UNIQUE KEY `uq_user_role` (`user_id`, `role_id`),
  CONSTRAINT `fk_user_roles_user` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`user_id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_user_roles_role` FOREIGN KEY (`role_id`)
    REFERENCES `roles` (`role_id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `role_permissions` (
  `role_permission_id` INT AUTO_INCREMENT PRIMARY KEY,
  `role_id` INT NOT NULL,
  `permission_id` INT NOT NULL,
  `granted_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_role_permission` (`role_id`, `permission_id`),
  CONSTRAINT `fk_role_permissions_role` FOREIGN KEY (`role_id`)
    REFERENCES `roles` (`role_id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_role_permissions_permission` FOREIGN KEY (`permission_id`)
    REFERENCES `permissions` (`permission_id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. SESIONES Y AUDITORÍA
-- ============================================================

CREATE TABLE `user_sessions` (
  `session_id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `session_token` VARCHAR(255) NOT NULL UNIQUE,
  `refresh_token` VARCHAR(255) DEFAULT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `user_agent` TEXT DEFAULT NULL,
  `expires_at` TIMESTAMP NOT NULL,
  `last_activity` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_user_sessions_user` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`user_id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_audit_logs` (
  `audit_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT DEFAULT NULL,
  `action_id` INT NOT NULL,
  `affected_user_id` INT DEFAULT NULL,
  `details` TEXT DEFAULT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `occurred_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_audit_logs_user` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`user_id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_audit_logs_action` FOREIGN KEY (`action_id`)
    REFERENCES `audit_actions` (`action_id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 7. DATOS SEMILLA (Seed Data)
-- ============================================================

-- Estados
INSERT INTO `account_statuses` (`status_id`, `status_code`, `status_name`, `description`) VALUES
(1, 'ACTIVE',    'Activo',     'Cuenta operativa y habilitada'),
(2, 'INACTIVE',  'Inactivo',   'Cuenta desactivada temporalmente'),
(3, 'SUSPENDED', 'Suspendido', 'Cuenta suspendida por politicas'),
(4, 'BANNED',    'Bloqueado',  'Cuenta bloqueada permanentemente'),
(5, 'PENDING',   'Pendiente',  'Cuenta pendiente de verificacion');

-- Roles
INSERT INTO `roles` (`role_id`, `role_code`, `role_name`, `description`, `is_assignable`) VALUES
(1, 'SUPER_ADMIN', 'Super Administrador', 'Control total del sistema', 0),
(2, 'ADMIN',       'Administrador',       'Gestion de usuarios y configuraciones', 1),
(3, 'MANAGER',     'Gestor',              'Visualizacion y gestion de equipo', 1),
(4, 'USER',        'Usuario',             'Permisos basicos de usuario', 1),
(5, 'GUEST',       'Invitado',            'Acceso solo lectura', 1);

-- Permisos
INSERT INTO `permissions` (`permission_code`, `permission_name`, `module`) VALUES
('users.read',        'Ver usuarios',           'users'),
('users.create',      'Crear usuarios',         'users'),
('users.update',      'Actualizar usuarios',    'users'),
('users.delete',      'Eliminar usuarios',      'users'),
('roles.read',        'Ver roles',              'roles'),
('roles.assign',      'Asignar roles',          'roles'),
('profile.read',      'Ver perfil propio',      'profile'),
('profile.update',    'Actualizar perfil',      'profile'),
('system.settings',   'Configurar sistema',     'system'),
('audit.read',        'Ver logs de auditoria',  'audit'),
('sessions.manage',   'Gestionar sesiones',     'sessions');

-- Acciones Auditoría
INSERT INTO `audit_actions` (`action_code`, `action_name`, `category`) VALUES
('LOGIN_SUCCESS',  'Inicio de sesion exitoso',    'authentication'),
('LOGIN_FAILURE',  'Fallo de inicio de sesion',   'authentication'),
('LOGOUT',         'Cierre de sesion',            'authentication'),
('REGISTER',       'Registro de usuario',         'account'),
('USER_DELETE',    'Eliminacion de usuario',      'account');

-- Asignación de permisos al Super Admin y Admin
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 1, permission_id FROM `permissions`;

INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 2, permission_id FROM `permissions` WHERE `permission_code` != 'system.settings';

-- ============================================================
-- 8. USUARIOS INICIALES DE PRUEBA
-- ============================================================

-- Contraseña por defecto: 123456 (o la que ingreses al iniciar sesión)
INSERT INTO `users` (`user_id`, `email`, `username`, `password_hash`, `email_verified`, `status_id`) VALUES
(1, 'maria@ejemplo.com',  'maria_gz',  '123456', 1, 1),
(2, 'carlos@ejemplo.com', 'carlos_p',  '123456', 1, 1),
(3, 'ana@ejemplo.com',    'ana_m',     '123456', 1, 1),
(4, 'luis@ejemplo.com',   'luis_r',    '123456', 0, 2),
(5, 'sofia@ejemplo.com',  'sofia_l',   '123456', 1, 1),
(6, 'javier@ejemplo.com', 'javier_g',  '123456', 0, 5),
(7, 'admin@ejemplo.com',  'admin_root','123456', 1, 1);

-- Perfiles de usuarios
INSERT INTO `user_profiles` (`user_id`, `first_name`, `last_name`, `phone_number`, `timezone`, `locale`, `biography`) VALUES
(1, 'María',  'González',  '+34 600 111 222', 'UTC', 'es', 'Administradora de sistemas y seguridad.'),
(2, 'Carlos', 'Pérez',     '+34 600 333 444', 'America/Bogota', 'es', 'Desarrollador frontend React.'),
(3, 'Ana',    'Martínez',  '+34 600 555 666', 'America/Mexico_City', 'es', 'Gestora de proyectos y operaciones.'),
(4, 'Luis',   'Rodríguez', '+34 600 777 888', 'UTC', 'es', 'Especialista en base de datos.'),
(5, 'Sofía',  'López',     '+34 600 999 000', 'Europe/Madrid', 'es', 'Diseñadora de interfaces y UX.'),
(6, 'Javier', 'Gómez',     '+34 611 222 333', 'UTC', 'es', 'Invitado para pruebas de integración.'),
(7, 'Admin',  'Principal', '+34 600 000 000', 'UTC', 'es', 'Cuenta con privilegios Super Admin.');

-- Asignación de Roles
INSERT INTO `user_roles` (`user_id`, `role_id`, `is_primary`) VALUES
(1, 2, 1), -- María: Administrador
(2, 4, 1), -- Carlos: Usuario
(3, 3, 1), -- Ana: Gestor
(4, 4, 1), -- Luis: Usuario
(5, 4, 1), -- Sofía: Usuario
(6, 5, 1), -- Javier: Invitado
(7, 1, 1); -- Admin: Super Administrador
