import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Inicializamos la respuesta base de Next.js
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  // Creamos el cliente de Supabase adaptado para leer/escribir cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Extraemos el usuario actual validando el JWT de las cookies
  const { data: { user } } = await supabase.auth.getUser();

  // Bloqueo de seguridad perimetral para rutas protegidas
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // 1. Si no hay sesión, lo enviamos al login
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // 2. Si hay sesión pero no es admin, lo expulsamos a la tienda principal
    if (user.user_metadata?.rol !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return response;
}

// Filtramos en qué rutas se ejecuta el middleware para optimizar el rendimiento
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};