import { getDb } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { name, email, password } = await request.json();

    if (!email || !password) {
      return Response.json(
        { success: false, message: 'Email y contraseña son obligatorios' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return Response.json(
        { success: false, message: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Comprobar si ya existe
    const existing = await db.execute({
      sql: 'SELECT id FROM users WHERE email = ?',
      args: [email.toLowerCase().trim()],
    });

    if (existing.rows.length > 0) {
      return Response.json(
        { success: false, message: 'El correo electrónico ya está registrado' },
        { status: 409 }
      );
    }

    // Hashear contraseña
    const passwordHash = await bcrypt.hash(password, 10);
    const userName = name?.trim() || email.split('@')[0];

    // Asignar ADMIN al primer usuario o por defecto
    const userCount = await db.execute('SELECT COUNT(*) as count FROM users');
    const isFirstUser = Number(userCount.rows[0].count) === 0;
    const role = isFirstUser ? 'ADMIN' : 'ADMIN'; // Todos los usuarios registrados tienen acceso al panel admin

    const result = await db.execute({
      sql: `INSERT INTO users (name, email, password_hash, role, status, provider)
            VALUES (?, ?, ?, ?, 'ACTIVE', 'credentials')
            RETURNING id, name, email, role, status`,
      args: [userName, email.toLowerCase().trim(), passwordHash, role],
    });

    return Response.json({
      success: true,
      message: 'Usuario registrado exitosamente',
      user: result.rows[0],
    });
  } catch (err) {
    console.error('Error en registro:', err);
    return Response.json(
      { success: false, message: err.message || 'Error en el servidor' },
      { status: 500 }
    );
  }
}
