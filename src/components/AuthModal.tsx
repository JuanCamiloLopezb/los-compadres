'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AuthModal({ open, onOpenChange, onSuccess }: AuthModalProps) {
  const [modo, setModo] = useState<'login' | 'registro'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    if (modo === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setErrorMsg('Credenciales inválidas. Verifica tu correo y contraseña.');
      } else {
        onOpenChange(false);
        if (onSuccess) onSuccess();
        window.location.reload();
      }
    } else {
      // Registro
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nombre: nombre,
            rol: 'cliente',
          },
        },
      });

      if (error) {
        setErrorMsg('Error en el registro: ' + error.message);
      } else {
        alert('¡Registro exitoso! Ya puedes iniciar sesión.');
        setModo('login');
      }
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border-blue-100">
        <DialogHeader className="text-center items-center">
          <div className="w-14 h-14 bg-blue-900 rounded-full flex items-center justify-center text-2xl font-black text-white shadow-md mb-2">
            🍺
          </div>
          <DialogTitle className="text-2xl font-black text-blue-950">
            {modo === 'login' ? '¡Bienvenido a El Compadre!' : 'Crear Cuenta'}
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            {modo === 'login' 
              ? 'Ingresa a tu cuenta para pedir tus licores a domicilio' 
              : 'Regístrate para realizar tus compras de forma rápida'}
          </DialogDescription>
        </DialogHeader>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-3 py-2">
          {modo === 'registro' && (
            <div>
              <label className="text-xs font-bold text-blue-950">Nombre Completo</label>
              <Input 
                required 
                placeholder="Ej: Juan Pérez" 
                value={nombre} 
                onChange={(e) => setNombre(e.target.value)}
                className="border-zinc-200 focus:border-blue-800"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-blue-950">Correo Electrónico</label>
            <Input 
              required 
              type="email" 
              placeholder="tu@correo.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              className="border-zinc-200 focus:border-blue-800"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-blue-950">Contraseña</label>
            <Input 
              required 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              className="border-zinc-200 focus:border-blue-800"
            />
          </div>

          {errorMsg && (
            <p className="text-xs font-bold text-red-600 bg-red-50 p-2 rounded text-center border border-red-200">
              {errorMsg}
            </p>
          )}

          <Button 
            type="submit" 
            disabled={loading} 
            className="w-full font-bold bg-blue-900 hover:bg-blue-950 text-white shadow-md py-5"
          >
            {loading ? 'Procesando...' : modo === 'login' ? 'Iniciar Sesión' : 'Registrarme'}
          </Button>
        </form>

        {/* Cambiar entre Login y Registro */}
        <div className="text-center pt-2 border-t border-zinc-100 text-xs">
          {modo === 'login' ? (
            <p className="text-zinc-500">
              ¿Aún no tienes cuenta?{' '}
              <button 
                type="button" 
                onClick={() => { setModo('registro'); setErrorMsg(null); }}
                className="font-bold text-blue-900 hover:underline"
              >
                Regístrate aquí
              </button>
            </p>
          ) : (
            <p className="text-zinc-500">
              ¿Ya tienes cuenta?{' '}
              <button 
                type="button" 
                onClick={() => { setModo('login'); setErrorMsg(null); }}
                className="font-bold text-blue-900 hover:underline"
              >
                Inicia Sesión
              </button>
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}