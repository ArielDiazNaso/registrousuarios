import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import GitHubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { TursoAdapter } from '@/lib/turso-adapter';
import { getDb, initDb } from '@/lib/db';

let dbInitialized = false;
async function ensureDb() {
  if (!dbInitialized) {
    try {
      await initDb();
      dbInitialized = true;
    } catch (e) {
      console.error('Error inicializando base de datos:', e.message);
    }
  }
}

const providers = [
  CredentialsProvider({
    name: 'Credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      await ensureDb();
      if (!credentials?.email || !credentials?.password) {
        throw new Error('Email y contraseña requeridos');
      }

      const db = getDb();
      const result = await db.execute({
        sql: 'SELECT * FROM users WHERE email = ?',
        args: [credentials.email.toLowerCase().trim()],
      });

      const user = result.rows[0];
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      if (!user.password_hash) {
        throw new Error('Esta cuenta fue creada con redes sociales. Iniciá sesión con ese proveedor.');
      }

      const isValid = await bcrypt.compare(credentials.password, user.password_hash);
      if (!isValid) {
        throw new Error('Contraseña incorrecta');
      }

      return {
        id: String(user.id),
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role || 'ADMIN',
        status: user.status || 'ACTIVE',
        provider: user.provider || 'credentials',
      };
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
  providers.push(
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    })
  );
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  providers.push(
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    })
  );
}

export const authOptions = {
  adapter: TursoAdapter(),
  providers,
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt', // Requerido para soportar tanto Credentials como OAuth
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async signIn() {
      await ensureDb();
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = user.role || 'ADMIN';
        token.status = user.status || 'ACTIVE';
        token.provider = account?.provider || user.provider || 'credentials';
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id;
        session.user.role = token.role ?? 'ADMIN';
        session.user.status = token.status ?? 'ACTIVE';
        session.user.provider = token.provider;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
