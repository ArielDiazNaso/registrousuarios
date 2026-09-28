import { getDb } from '../../../../lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

// PUT /api/profile/[id]
export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return Response.json({ success: false, message: 'No autorizado' }, { status: 401 });
  }

  // Solo el propio usuario puede editar su perfil
  if (String(session.user.id) !== String(params.id)) {
    return Response.json({ success: false, message: 'Solo podés editar tu propio perfil' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { first_name, last_name, phone_number, timezone, locale, biography } = body;
    const db = getDb();

    const fullName = first_name && last_name ? `${first_name} ${last_name}` : null;

    await db.execute({
      sql: `UPDATE users SET
              name = COALESCE(?, name),
              first_name = COALESCE(?, first_name),
              last_name = COALESCE(?, last_name),
              phone_number = COALESCE(?, phone_number),
              timezone = COALESCE(?, timezone),
              locale = COALESCE(?, locale),
              biography = COALESCE(?, biography),
              updated_at = datetime('now')
            WHERE id = ?`,
      args: [
        fullName,
        first_name ?? null,
        last_name ?? null,
        phone_number ?? null,
        timezone ?? null,
        locale ?? null,
        biography ?? null,
        Number(params.id),
      ],
    });

    return Response.json({ success: true, message: 'Perfil actualizado correctamente' });
  } catch (err) {
    return Response.json({ success: false, message: err.message }, { status: 500 });
  }
}
