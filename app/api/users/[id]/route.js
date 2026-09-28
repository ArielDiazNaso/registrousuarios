import { getDb } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// PUT /api/users/[id] — Edita usuario
export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return Response.json({ success: false, message: 'No autorizado' }, { status: 401 });
  }

  try {
    const { id } = params;
    const body = await request.json();
    const { name, email, role, status, first_name, last_name } = body;
    const db = getDb();

    await db.execute({
      sql: `UPDATE users SET
              name = COALESCE(?, name),
              email = COALESCE(?, email),
              role = COALESCE(?, role),
              status = COALESCE(?, status),
              first_name = COALESCE(?, first_name),
              last_name = COALESCE(?, last_name),
              updated_at = datetime('now')
            WHERE id = ?`,
      args: [
        name ?? null,
        email ?? null,
        role ?? null,
        status ?? null,
        first_name ?? null,
        last_name ?? null,
        Number(id),
      ],
    });

    return Response.json({ success: true, message: 'Usuario actualizado correctamente' });
  } catch (err) {
    return Response.json({ success: false, message: err.message }, { status: 500 });
  }
}

// DELETE /api/users/[id] — Elimina usuario
export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return Response.json({ success: false, message: 'No autorizado' }, { status: 401 });
  }

  try {
    const { id } = params;
    const db = getDb();
    await db.execute({
      sql: 'DELETE FROM users WHERE id = ?',
      args: [Number(id)],
    });
    return Response.json({ success: true, message: `Usuario ${id} eliminado` });
  } catch (err) {
    return Response.json({ success: false, message: err.message }, { status: 500 });
  }
}

// PATCH /api/users/[id]/status
export async function PATCH(request, { params }) {
  return PUT(request, { params });
}
