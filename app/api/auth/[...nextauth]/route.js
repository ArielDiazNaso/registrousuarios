import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import GitHubProvider from 'next-auth/providers/github';
import TwitchProvider from 'next-auth/providers/twitch';
import { TursoAdapter } from '../../../lib/turso-adapter';
import { initDb } from '../../../lib/db';

// Asegurar que las tablas existan al iniciar
let dbInitialized = false;
async function ensureDb() {
  if (!dbInitialized) {
    await initDb();
    dbInitialized = true;
  }
}

export const authOptions = {
  adapter: TursoAdapter(),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
    TwitchProvider({
      clientId: process.env.TWITCH_CLIENT_ID,
      clientSecret: process.env.TWITCH_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      await ensureDb();
      return true;
    },
    async session({ session, user }) {
      if (session?.user) {
        session.user.id = user.id;
        session.user.role = user.role ?? 'USER';
        session.user.status = user.status ?? 'ACTIVE';
        session.user.first_name = user.first_name;
        session.user.last_name = user.last_name;
        session.user.provider = user.provider;
      }
      return session;
    },
  },
  session: {
    strategy: 'database',
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
