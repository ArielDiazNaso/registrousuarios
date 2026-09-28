import { getDb } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET /api/users — Lista todos los usuarios (solo admins)
export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return Response.json({ success: false, message: 'No autorizado' }, { status: 401 });
  }
  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
    return Response.json({ success: false, message: 'Sin permisos' }, { status: 403 });
  }

  try {
    const db = getDb();
    const result = await db.execute(
      'SELECT id, name, email, image, role, status, provider, first_name, last_name, created_at FROM users ORDER BY id ASC'
    );
    return Response.json({ success: true, data: result.rows });
  } catch (err) {
    return Response.json({ success: false, message: err.message }, { status: 500 });
  }
}

// POST /api/users — Crea un usuario manualmente
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    return Response.json({ success: false, message: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, email, role = 'USER', status = 'ACTIVE', first_name, last_name } = body;

    if (!email) {
      return Response.json({ success: false, message: 'El email es requerido' }, { status: 400 });
    }

    const db = getDb();
    const result = await db.execute({
      sql: `INSERT INTO users (name, email, role, status, first_name, last_name, provider)
            VALUES (?, ?, ?, ?, ?, ?, 'manual')
            RETURNING id, name, email, role, status, first_name, last_name`,
      args: [name ?? null, email, role, status, first_name ?? null, last_name ?? null],
    });

    return Response.json({ success: true, data: result.rows[0] });
  } catch (err) {
    if (err.message?.includes('UNIQUE')) {
      return Response.json({ success: false, message: 'El email ya está registrado' }, { status: 409 });
    }
    return Response.json({ success: false, message: err.message }, { status: 500 });
  }
}
