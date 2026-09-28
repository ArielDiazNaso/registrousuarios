import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Configuración de conexión a XAMPP MySQL
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'userhub_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

let pool = null;

const getPool = () => {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
};

// Middleware para verificar conexión a MySQL
const checkDb = async (req, res, next) => {
  try {
    const connection = await getPool().getConnection();
    connection.release();
    next();
  } catch (error) {
    console.error('Error al conectar a MySQL en XAMPP:', error.message);
    return res.status(503).json({
      success: false,
      message: 'No se pudo conectar a la base de datos MySQL en XAMPP. Asegúrate de que el módulo MySQL en XAMPP esté iniciado (Start) y que la base de datos "userhub_db" esté importada.',
      error: error.message,
    });
  }
};

// -------------------------------------------------------------
// RUTAS DE LA API
// -------------------------------------------------------------

// Estado de conexión
app.get('/api/health', checkDb, async (req, res) => {
  res.json({
    success: true,
    message: 'Conexión a MySQL en XAMPP establecida correctamente.',
    database: dbConfig.database,
  });
});

// Autenticación: Login
app.post('/api/auth/login', checkDb, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email y contraseña requeridos.' });
  }

  try {
    const db = getPool();
    const [rows] = await db.query(
      `SELECT u.user_id, u.email, u.username, u.password_hash, u.status_id,
              p.first_name, p.last_name, p.phone_number, p.timezone, p.locale, p.biography,
              r.role_id, r.role_code, r.role_name,
              ast.status_code
       FROM users u
       LEFT JOIN user_profiles p ON u.user_id = p.user_id
       LEFT JOIN user_roles ur ON u.user_id = ur.user_id
       LEFT JOIN roles r ON ur.role_id = r.role_id
       LEFT JOIN account_statuses ast ON u.status_id = ast.status_id
       WHERE u.email = ? OR u.username = ? LIMIT 1`,
      [email, email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Usuario no encontrado en la base de datos MySQL.' });
    }

    const user = rows[0];
    // En producción usar bcrypt.compare. Aquí validamos coincidencia directa o modo demo:
    if (user.password_hash !== password && password.length < 6) {
      return res.status(401).json({ success: false, message: 'Contraseña incorrecta.' });
    }

    const token = `token_jwt_${user.user_id}_${Date.now()}`;

    res.json({
      success: true,
      data: {
        token,
        user: {
          user_id: user.user_id,
          email: user.email,
          username: user.username,
          first_name: user.first_name || 'Usuario',
          last_name: user.last_name || '',
          phone_number: user.phone_number || '',
          timezone: user.timezone || 'UTC',
          locale: user.locale || 'es',
          biography: user.biography || '',
          role: {
            role_id: user.role_id || 4,
            role_code: user.role_code || 'USER',
            role_name: user.role_name || 'Usuario',
          },
          status_code: user.status_code || 'ACTIVE',
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Autenticación: Registro
app.post('/api/auth/register', checkDb, async (req, res) => {
  const { email, username, password, first_name, last_name } = req.body;
  if (!email || !username || !password || !first_name || !last_name) {
    return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios.' });
  }

  const db = getPool();
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Comprobar si ya existe
    const [existing] = await conn.query('SELECT user_id FROM users WHERE email = ? OR username = ?', [email, username]);
    if (existing.length > 0) {
      await conn.rollback();
      return res.status(409).json({ success: false, message: 'El correo o nombre de usuario ya está registrado en MySQL.' });
    }

    // Insertar usuario
    const [userRes] = await conn.query(
      'INSERT INTO users (email, username, password_hash, status_id) VALUES (?, ?, ?, 1)',
      [email, username, password]
    );
    const userId = userRes.insertId;

    // Insertar perfil
    await conn.query(
      'INSERT INTO user_profiles (user_id, first_name, last_name) VALUES (?, ?, ?)',
      [userId, first_name, last_name]
    );

    // Asignar rol de usuario estándar (role_id = 4)
    await conn.query(
      'INSERT INTO user_roles (user_id, role_id, is_primary) VALUES (?, 4, 1)',
      [userId]
    );

    await conn.commit();

    const token = `token_jwt_${userId}_${Date.now()}`;
    res.json({
      success: true,
      data: {
        token,
        user: {
          user_id: userId,
          email,
          username,
          first_name,
          last_name,
          role: { role_id: 4, role_code: 'USER', role_name: 'Usuario' },
          status_code: 'ACTIVE',
        },
      },
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
});

// Gestión de Usuarios: Listar todos
app.get('/api/users', checkDb, async (req, res) => {
  try {
    const db = getPool();
    const [rows] = await db.query(
      `SELECT u.user_id AS id,
              CONCAT(COALESCE(p.first_name, ''), ' ', COALESCE(p.last_name, '')) AS name,
              p.first_name, p.last_name,
              u.email, u.username,
              COALESCE(r.role_id, 4) AS role_id,
              COALESCE(r.role_name, 'Usuario') AS role,
              COALESCE(ast.status_id, 1) AS status_id,
              COALESCE(ast.status_name, 'Activo') AS status
       FROM users u
       LEFT JOIN user_profiles p ON u.user_id = p.user_id
       LEFT JOIN user_roles ur ON u.user_id = ur.user_id
       LEFT JOIN roles r ON ur.role_id = r.role_id
       LEFT JOIN account_statuses ast ON u.status_id = ast.status_id
       ORDER BY u.user_id ASC`
    );

    const formatted = rows.map((r) => ({
      id: r.id,
      name: r.name.trim() || r.username || r.email,
      first_name: r.first_name || '',
      last_name: r.last_name || '',
      email: r.email,
      username: r.username,
      role: r.role,
      role_id: r.role_id,
      status: r.status,
      status_id: r.status_id,
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Roles map helper
const ROLE_NAME_TO_ID = {
  'Super Administrador': 1,
  'SUPER_ADMIN': 1,
  'Administrador': 2,
  'ADMIN': 2,
  'Gestor': 3,
  'MANAGER': 3,
  'Usuario': 4,
  'USER': 4,
  'Invitado': 5,
  'GUEST': 5,
};

const STATUS_NAME_TO_ID = {
  'Activo': 1,
  'ACTIVE': 1,
  'Inactivo': 2,
  'INACTIVE': 2,
  'Suspendido': 3,
  'SUSPENDED': 3,
  'Bloqueado': 4,
  'BANNED': 4,
  'Pendiente': 5,
  'PENDING': 5,
};

// Gestión de Usuarios: Crear nuevo usuario
app.post('/api/users', checkDb, async (req, res) => {
  const { name, first_name, last_name, email, username, role, status, password } = req.body;
  const fName = first_name || (name ? name.split(' ')[0] : 'Usuario');
  const lName = last_name || (name ? name.split(' ').slice(1).join(' ') : '');
  const uEmail = email ? email.trim() : '';
  const uUsername = username ? username.trim() : uEmail.split('@')[0] || `user_${Date.now()}`;
  const uPassword = password || '123456';
  const roleId = ROLE_NAME_TO_ID[role] || (typeof role === 'number' ? role : 4);
  const statusId = STATUS_NAME_TO_ID[status] || (typeof status === 'number' ? status : 1);

  if (!uEmail) {
    return res.status(400).json({ success: false, message: 'El correo electrónico es requerido.' });
  }

  const db = getPool();
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [userRes] = await conn.query(
      'INSERT INTO users (email, username, password_hash, status_id) VALUES (?, ?, ?, ?)',
      [uEmail, uUsername, uPassword, statusId]
    );
    const userId = userRes.insertId;

    await conn.query(
      'INSERT INTO user_profiles (user_id, first_name, last_name) VALUES (?, ?, ?)',
      [userId, fName, lName]
    );

    await conn.query(
      'INSERT INTO user_roles (user_id, role_id, is_primary) VALUES (?, ?, 1)',
      [userId, roleId]
    );

    await conn.commit();

    const newUser = {
      id: userId,
      name: `${fName} ${lName}`.trim() || uUsername,
      first_name: fName,
      last_name: lName,
      email: uEmail,
      username: uUsername,
      role: role || 'Usuario',
      role_id: roleId,
      status: status || 'Activo',
      status_id: statusId,
    };

    res.json({ success: true, data: newUser, message: 'Usuario creado exitosamente en MySQL.' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
});

// Gestión de Usuarios: Editar usuario existente
app.put('/api/users/:id', checkDb, async (req, res) => {
  const { id } = req.params;
  const { name, first_name, last_name, email, username, role, status } = req.body;
  const fName = first_name || (name ? name.split(' ')[0] : undefined);
  const lName = last_name !== undefined ? last_name : (name ? name.split(' ').slice(1).join(' ') : undefined);
  const roleId = ROLE_NAME_TO_ID[role] || (typeof role === 'number' ? role : undefined);
  const statusId = STATUS_NAME_TO_ID[status] || (typeof status === 'number' ? status : undefined);

  const db = getPool();
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    if (email || username || statusId) {
      await conn.query(
        `UPDATE users
         SET email = COALESCE(?, email),
             username = COALESCE(?, username),
             status_id = COALESCE(?, status_id)
         WHERE user_id = ?`,
        [email || null, username || null, statusId || null, id]
      );
    }

    if (fName !== undefined || lName !== undefined) {
      await conn.query(
        `INSERT INTO user_profiles (user_id, first_name, last_name)
         VALUES (?, COALESCE(?, 'Usuario'), COALESCE(?, ''))
         ON DUPLICATE KEY UPDATE
           first_name = COALESCE(?, first_name),
           last_name = COALESCE(?, last_name)`,
        [id, fName || null, lName || null, fName || null, lName || null]
      );
    }

    if (roleId) {
      await conn.query(
        `INSERT INTO user_roles (user_id, role_id, is_primary)
         VALUES (?, ?, 1)
         ON DUPLICATE KEY UPDATE role_id = ?`,
        [id, roleId, roleId]
      );
    }

    await conn.commit();

    res.json({
      success: true,
      message: 'Usuario actualizado correctamente en MySQL.',
      data: {
        id: Number(id),
        name: `${fName || ''} ${lName || ''}`.trim() || name || email,
        first_name: fName,
        last_name: lName,
        email,
        username,
        role,
        role_id: roleId,
        status,
        status_id: statusId,
      },
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
});

// Gestión de Usuarios: Cambiar estado (toggle o asignar)
app.patch('/api/users/:id/status', checkDb, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const statusId = STATUS_NAME_TO_ID[status] || (typeof status === 'number' ? status : 1);

  try {
    const db = getPool();
    await db.query('UPDATE users SET status_id = ? WHERE user_id = ?', [statusId, id]);
    res.json({ success: true, message: `Estado actualizado a ${status}.`, data: { id: Number(id), status, status_id: statusId } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Gestión de Usuarios: Eliminar usuario de MySQL
app.delete('/api/users/:id', checkDb, async (req, res) => {
  const { id } = req.params;
  try {
    const db = getPool();
    const [result] = await db.query('DELETE FROM users WHERE user_id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado en la base de datos.' });
    }
    res.json({ success: true, message: `Usuario con ID ${id} eliminado de la base de datos XAMPP MySQL.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Iniciar servidor Express
app.listen(PORT, () => {
  console.log(`\n🚀 Backend API conectado a XAMPP MySQL corriendo en http://localhost:${PORT}`);
  console.log(`📁 Base de datos configurada: ${dbConfig.database} en ${dbConfig.host}:${dbConfig.port}\n`);
});
