import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner'; // 1. IMPORTAR TOASTER
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'El Compadre - Licorería Express',
  description: 'Tus licores favoritos con envío rápido a domicilio.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        {children}
        
        {/* 2. INSERTAR TOASTER AQUÍ (Personalizado con los colores de El Compadre) */}
        <Toaster 
          position="bottom-right" 
          richColors 
          closeButton 
        />
      </body>
    </html>
  );
}