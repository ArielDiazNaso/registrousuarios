import { getDb } from './db';

/**
 * Adaptador personalizado de NextAuth para Turso (SQLite edge)
 * Implementa la interfaz completa de NextAuth Adapter
 */
export function TursoAdapter() {
  return {
    async createUser(user) {
      const db = getDb();
      // Asignamos ADMIN por defecto para que tengan acceso al panel de usuarios
      const result = await db.execute({
        sql: `INSERT INTO users (name, email, email_verified, image, role, provider)
              VALUES (?, ?, ?, ?, 'ADMIN', 'oauth')
              RETURNING id, name, email, email_verified, image, role`,
        args: [
          user.name ?? null,
          user.email,
          user.emailVerified ? 1 : 0,
          user.image ?? null,
        ],
      });
      const row = result.rows[0];
      return {
        id: String(row.id),
        name: row.name,
        email: row.email,
        emailVerified: row.email_verified ? new Date() : null,
        image: row.image,
        role: row.role || 'ADMIN',
      };
    },

    async getUser(id) {
      const db = getDb();
      const result = await db.execute({
        sql: 'SELECT * FROM users WHERE id = ?',
        args: [Number(id)],
      });
      if (!result.rows[0]) return null;
      return mapUser(result.rows[0]);
    },

    async getUserByEmail(email) {
      const db = getDb();
      const result = await db.execute({
        sql: 'SELECT * FROM users WHERE email = ?',
        args: [email],
      });
      if (!result.rows[0]) return null;
      return mapUser(result.rows[0]);
    },

    async getUserByAccount({ providerAccountId, provider }) {
      const db = getDb();
      const result = await db.execute({
        sql: `SELECT u.* FROM users u
              JOIN accounts a ON u.id = a.user_id
              WHERE a.provider = ? AND a.provider_account_id = ?`,
        args: [provider, providerAccountId],
      });
      if (!result.rows[0]) return null;
      return mapUser(result.rows[0]);
    },

    async updateUser(user) {
      const db = getDb();
      await db.execute({
        sql: `UPDATE users SET
                name = COALESCE(?, name),
                email = COALESCE(?, email),
                email_verified = COALESCE(?, email_verified),
                image = COALESCE(?, image),
                updated_at = datetime('now')
              WHERE id = ?`,
        args: [
          user.name ?? null,
          user.email ?? null,
          user.emailVerified ? 1 : null,
          user.image ?? null,
          Number(user.id),
        ],
      });
      return user;
    },

    async linkAccount(account) {
      const db = getDb();
      await db.execute({
        sql: `INSERT OR REPLACE INTO accounts
              (user_id, type, provider, provider_account_id, refresh_token,
               access_token, expires_at, token_type, scope, id_token, session_state)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          Number(account.userId),
          account.type,
          account.provider,
          account.providerAccountId,
          account.refresh_token ?? null,
          account.access_token ?? null,
          account.expires_at ?? null,
          account.token_type ?? null,
          account.scope ?? null,
          account.id_token ?? null,
          account.session_state ?? null,
        ],
      });
      return account;
    },

    async createSession({ sessionToken, userId, expires }) {
      const db = getDb();
      await db.execute({
        sql: 'INSERT INTO sessions (session_token, user_id, expires) VALUES (?, ?, ?)',
        args: [sessionToken, Number(userId), expires.toISOString()],
      });
      return { sessionToken, userId, expires };
    },

    async getSessionAndUser(sessionToken) {
      const db = getDb();
      const result = await db.execute({
        sql: `SELECT s.*, u.* FROM sessions s
              JOIN users u ON s.user_id = u.id
              WHERE s.session_token = ?`,
        args: [sessionToken],
      });
      if (!result.rows[0]) return null;
      const row = result.rows[0];
      return {
        session: {
          sessionToken: row.session_token,
          userId: String(row.user_id),
          expires: new Date(row.expires),
        },
        user: mapUser(row),
      };
    },

    async updateSession({ sessionToken, expires }) {
      const db = getDb();
      await db.execute({
        sql: 'UPDATE sessions SET expires = ? WHERE session_token = ?',
        args: [expires.toISOString(), sessionToken],
      });
      return { sessionToken, expires };
    },

    async deleteSession(sessionToken) {
      const db = getDb();
      await db.execute({
        sql: 'DELETE FROM sessions WHERE session_token = ?',
        args: [sessionToken],
      });
    },

    async createVerificationToken({ identifier, expires, token }) {
      const db = getDb();
      await db.execute({
        sql: 'INSERT INTO verification_tokens (identifier, token, expires) VALUES (?, ?, ?)',
        args: [identifier, token, expires.toISOString()],
      });
      return { identifier, expires, token };
    },

    async useVerificationToken({ identifier, token }) {
      const db = getDb();
      const result = await db.execute({
        sql: 'SELECT * FROM verification_tokens WHERE identifier = ? AND token = ?',
        args: [identifier, token],
      });
      if (!result.rows[0]) return null;
      await db.execute({
        sql: 'DELETE FROM verification_tokens WHERE identifier = ? AND token = ?',
        args: [identifier, token],
      });
      return {
        identifier: result.rows[0].identifier,
        token: result.rows[0].token,
        expires: new Date(result.rows[0].expires),
      };
    },
  };
}

function mapUser(row) {
  return {
    id: String(row.id),
    name: row.name,
    email: row.email,
    emailVerified: row.email_verified ? new Date() : null,
    image: row.image,
    role: row.role || 'ADMIN',
    status: row.status || 'ACTIVE',
    first_name: row.first_name,
    last_name: row.last_name,
    provider: row.provider,
  };
}
