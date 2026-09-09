'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

export default function PerfilPage() {
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  useEffect(() => {
    async function cargarPerfil() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = '/login';
        return;
      }

      setUserId(user.id);
      setEmail(user.email || '');

      // Consultar datos desde la tabla perfiles
      const { data: perfil } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (perfil) {
        setNombre(perfil.nombre || '');
        setTelefono(perfil.telefono || '');
        setDireccion(perfil.direccion || '');
      }

      setLoading(false);
    }

    cargarPerfil();
  }, []);

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje(null);

    const { error } = await supabase
      .from('perfiles')
      .upsert({
        id: userId,
        email,
        nombre,
        telefono,
        direccion,
      });

    if (error) {
      setMensaje({ tipo: 'error', texto: 'Error al actualizar perfil: ' + error.message });
    } else {
      setMensaje({ tipo: 'ok', texto: '¡Perfil actualizado correctamente!' });
    }
    setGuardando(false);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center font-bold text-zinc-800">Cargando perfil... 👤</div>;
  }

  return (
    <main className="min-h-screen bg-zinc-50 p-6 text-zinc-900 pb-20">
      <div className="max-w-2xl mx-auto space-y-6">
        
        <div className="flex justify-between items-center border-b border-zinc-200 pb-4">
          <div>
            <h1 className="text-3xl font-black">👤 Mi Perfil</h1>
            <p className="text-xs text-zinc-500">Gestiona tu información personal y datos de entrega.</p>
          </div>
          <Link href="/">
            <Button variant="outline" className="font-bold">Volver a la Tienda</Button>
          </Link>
        </div>

        <Card className="shadow-sm border-zinc-200 bg-white">
          <CardHeader>
            <CardTitle>Información de la Cuenta</CardTitle>
            <CardDescription>Estos datos se usarán para agilizar tus envíos a domicilio.</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleGuardar} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-700">Correo Electrónico</label>
                <Input value={email} disabled className="bg-zinc-100 font-medium text-zinc-500" />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700">Nombre Completo</label>
                <Input 
                  required 
                  placeholder="Ej: Juan Carlos Pérez" 
                  value={nombre} 
                  onChange={(e) => setNombre(e.target.value)} 
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-700">Teléfono / Celular</label>
                  <Input 
                    placeholder="Ej: 3001234567" 
                    value={telefono} 
                    onChange={(e) => setTelefono(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-700">Dirección Predeterminada</label>
                  <Input 
                    placeholder="Ej: Calle 100 # 15-20" 
                    value={direccion} 
                    onChange={(e) => setDireccion(e.target.value)} 
                  />
                </div>
              </div>

              {mensaje && (
                <p className={`text-xs font-bold p-2 rounded ${mensaje.tipo === 'ok' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {mensaje.texto}
                </p>
              )}

              <Button type="submit" disabled={guardando} className="w-full font-bold bg-zinc-900 hover:bg-black text-white">
                {guardando ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </form>
          </CardContent>
        </Card>

      </div>
    </main>
  );
}