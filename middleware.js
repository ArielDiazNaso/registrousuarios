import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

// Rutas que requieren autenticación
export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*', '/users/:path*', '/settings/:path*'],
};
