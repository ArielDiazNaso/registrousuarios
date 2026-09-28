import { Inter } from 'next/font/google';
import '../src/styles/index.css';
import Providers from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'UserHub — Gestión de Usuarios',
  description: 'Sistema de gestión de usuarios con login social',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
