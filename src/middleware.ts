import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Proteger rutas de administración
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Si no está autenticado, enviar al login
    if (!user) {
      return NextResponse.redirect(
        new URL('/login', request.url)
      );
    }

    // Obtener el rol del usuario
    const rol = user.user_metadata?.rol;

    // Solo los administradores pueden entrar
    if (rol !== 'administrador') {
      return NextResponse.redirect(
        new URL('/', request.url)
      );
    }
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*'],
};