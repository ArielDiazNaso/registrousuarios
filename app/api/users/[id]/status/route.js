import { getDb } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// PATCH /api/users/[id]/status
export async function PATCH(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    return Response.json({ success: false, message: 'No autorizado' }, { status: 401 });
  }

  try {
    const { id } = params;
    const { status } = await request.json();
    const db = getDb();
    await db.execute({
      sql: `UPDATE users SET status = ?, updated_at = datetime('now') WHERE id = ?`,
      args: [status, Number(id)],
    });
    return Response.json({ success: true, data: { id: Number(id), status } });
  } catch (err) {
    return Response.json({ success: false, message: err.message }, { status: 500 });
  }
}
