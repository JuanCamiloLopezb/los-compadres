'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const [mensaje, setMensaje] = useState<{
    tipo: 'error' | 'exito';
    texto: string;
  } | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setMensaje(null);

    try {
      if (isLogin) {
        // =========================
        // INICIAR SESIÓN
        // =========================
        const { data, error } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          });

        if (error) {
          throw error;
        }

        const user = data.user;

        if (!user) {
          throw new Error('No se pudo obtener la información del usuario.');
        }

        // Obtener el rol guardado en los metadatos de Supabase
        const rol = user.user_metadata?.rol;

        console.log('Usuario:', user.email);
        console.log('Rol:', rol);

        // =========================
        // REDIRECCIÓN SEGÚN ROL
        // =========================
        if (rol === 'administrador') {
          router.push('/admin');
        } else {
          router.push('/');
        }

        router.refresh();

      } else {
        // =========================
        // REGISTRAR NUEVA CUENTA
        // =========================
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              rol: 'cliente',
            },
          },
        });

        if (error) {
          throw error;
        }

        setMensaje({
          tipo: 'exito',
          texto:
            '¡Cuenta creada! Revisa tu correo para verificarla si es necesario y luego inicia sesión.',
        });

        setIsLogin(true);
        setPassword('');
      }
    } catch (error: any) {
      setMensaje({
        tipo: 'error',
        texto:
          error?.message ||
          'Ocurrió un error al procesar la solicitud.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">

      <Card className="w-full max-w-md shadow-lg border-zinc-200">

        <CardHeader className="text-center space-y-2">

          <CardTitle className="text-3xl font-black text-zinc-900">
            {isLogin
              ? 'Bienvenido de nuevo'
              : 'Crea tu cuenta'}
          </CardTitle>

          <CardDescription className="text-zinc-500">
            {isLogin
              ? 'Ingresa tus credenciales para continuar comprando.'
              : 'Únete a Los Compadres en segundos.'}
          </CardDescription>

        </CardHeader>

        <form onSubmit={handleAuth}>

          <CardContent className="space-y-4">

            {mensaje && (
              <div
                className={`p-3 rounded-md text-sm font-medium ${
                  mensaje.tipo === 'error'
                    ? 'bg-red-50 text-red-600'
                    : 'bg-green-50 text-green-600'
                }`}
              >
                {mensaje.texto}
              </div>
            )}

            {/* CORREO */}
            <div className="space-y-1">

              <label className="text-sm font-bold text-zinc-700">
                Correo Electrónico
              </label>

              <Input
                type="email"
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                required
                className="bg-zinc-50"
              />

            </div>

            {/* CONTRASEÑA */}
            <div className="space-y-1">

              <label className="text-sm font-bold text-zinc-700">
                Contraseña
              </label>

              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                required
                className="bg-zinc-50"
              />

            </div>

          </CardContent>

          <CardFooter className="flex flex-col space-y-4">

            <Button
              type="submit"
              className="w-full font-bold"
              disabled={loading}
            >
              {loading
                ? 'Cargando...'
                : isLogin
                  ? 'Iniciar Sesión'
                  : 'Registrarse'}
            </Button>

            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setMensaje(null);
              }}
              className="text-sm text-zinc-500 hover:text-zinc-900 font-medium transition-colors"
            >
              {isLogin
                ? '¿No tienes cuenta? Regístrate aquí'
                : '¿Ya tienes cuenta? Inicia sesión'}
            </button>

          </CardFooter>

        </form>

      </Card>

    </main>
  );
}