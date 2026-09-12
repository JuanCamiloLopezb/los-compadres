'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Package, Clock, CheckCircle2, Truck, ShoppingBag, ArrowLeft, MapPin, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface Direccion {
  id: string;
  etiqueta: string;
  ciudad: string;
  direccion: string;
  datos_adicionales?: string;
  es_predeterminada: boolean;
}

interface DetallePedido {
  id: string;
  cantidad: number;
  precio_unitario: number;
  productos?: {
    nombre: string;
  };
}

interface Pedido {
  id: string;
  created_at: string;
  total: number;
  estado: string;
  direccion: string;
  metodo_pago?: string;
  detalle_pedidos?: DetallePedido[];
}

const ESTADOS_TIMELINE = [
  { clave: 'PENDIENTE DE PAGO', etiqueta: 'Pendiente', icono: Clock },
  { clave: 'PAGADO', etiqueta: 'Pagado', icono: CheckCircle2 },
  { clave: 'PEDIDO EN PREPARACION', etiqueta: 'En Cava', icono: Package },
  { clave: 'PEDIDO DESPACHADO', etiqueta: 'En Camino', icono: Truck },
  { clave: 'PEDIDO ENTREGADO', etiqueta: 'Entregado', icono: ShoppingBag },
];

export default function PerfilPage() {
  const [tab, setTab] = useState<'pedidos' | 'direcciones'>('pedidos');
  const [usuario, setUsuario] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Direcciones
  const [direcciones, setDirecciones] = useState<Direccion[]>([]);
  const [modalNuevaDir, setModalNuevaDir] = useState(false);
  const [etiquetaDir, setEtiquetaDir] = useState('Casa');
  const [ciudadDir, setCiudadDir] = useState('Barranquilla');
  const [textoDir, setTextoDir] = useState('');
  const [datosAdicDir, setDatosAdicDir] = useState('');

  // Pedidos
  const [pedidos, setPedidos] = useState<Pedido[]>([]);

  const cargarDatos = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = '/';
      return;
    }
    setUsuario(user);

    // 1. Cargar Direcciones
    const { data: dirs } = await supabase
      .from('direcciones')
      .select('*')
      .eq('usuario_id', user.id)
      .order('created_at', { ascending: false });
    setDirecciones(dirs || []);

    // 2. Cargar TODOS los Pedidos (Intentando por usuario_id o trayendo los más recientes)
    const { data: peds } = await supabase
      .from('pedidos')
      .select('*, detalle_pedidos(*, productos(nombre))')
      .or(`usuario_id.eq.${user.id},usuario_id.is.null`)
      .order('created_at', { ascending: false });

    setPedidos(peds || []);
    setLoading(false);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleAgregarDireccion = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('direcciones').insert([{
      usuario_id: usuario.id,
      etiqueta: etiquetaDir,
      ciudad: ciudadDir,
      direccion: textoDir,
      datos_adicionales: datosAdicDir,
      es_predeterminada: direcciones.length === 0
    }]);

    setTextoDir('');
    setDatosAdicDir('');
    setModalNuevaDir(false);
    cargarDatos();
  };

  const eliminarDireccion = async (id: string) => {
    await supabase.from('direcciones').delete().eq('id', id);
    cargarDatos();
  };

  const getPasoActual = (estadoActual: string) => {
    const idx = ESTADOS_TIMELINE.findIndex((e) => e.clave === estadoActual);
    return idx === -1 ? 0 : idx;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center font-bold text-[#073b78] text-sm">
        Cargando perfil en El Compadre... 🍺
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf8] text-zinc-900 pb-20 font-sans">
      
      {/* Header */}
      <header className="bg-[#073b78] text-white py-5 px-8 shadow-md flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-white text-[#073b78] font-serif font-black px-3.5 py-1 text-2xl rounded">EC</div>
          <div>
            <h1 className="font-serif text-xl font-bold">Mi Cuenta</h1>
            <p className="text-xs text-blue-200">{usuario.email}</p>
          </div>
        </div>

        <Link href="/">
          <Button variant="outline" className="text-white border-white/30 hover:bg-white/10 text-xs gap-1">
            <ArrowLeft className="w-4 h-4" /> Volver a la Tienda
          </Button>
        </Link>
      </header>

      <div className="max-w-5xl mx-auto p-6 md:p-10 space-y-8">
        
        {/* NAVEGACIÓN */}
        <div className="flex border-b border-zinc-200 gap-6 text-sm font-bold">
          <button
            onClick={() => setTab('pedidos')}
            className={`flex items-center gap-2 pb-3 border-b-2 uppercase tracking-wider transition-all cursor-pointer ${
              tab === 'pedidos' ? 'border-[#073b78] text-[#073b78]' : 'border-transparent text-zinc-400'
            }`}
          >
            <Package className="w-4 h-4" /> Mis Pedidos ({pedidos.length})
          </button>

          <button
            onClick={() => setTab('direcciones')}
            className={`flex items-center gap-2 pb-3 border-b-2 uppercase tracking-wider transition-all cursor-pointer ${
              tab === 'direcciones' ? 'border-[#073b78] text-[#073b78]' : 'border-transparent text-zinc-400'
            }`}
          >
            <MapPin className="w-4 h-4" /> Direcciones Guardadas ({direcciones.length})
          </button>
        </div>

        {/* PESTAÑA PEDIDOS */}
        {tab === 'pedidos' && (
          <div className="space-y-6">
            {pedidos.length === 0 ? (
              <Card className="bg-white border-zinc-200 text-center py-12 p-6 shadow-sm">
                <Package className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
                <h3 className="font-serif text-lg font-bold text-zinc-800">Aún no tienes pedidos registrados</h3>
                <p className="text-xs text-zinc-500 mt-1 mb-4">Tus compras a domicilio aparecerán aquí con seguimiento en tiempo real.</p>
                <Link href="/">
                  <Button className="bg-[#073b78] text-white font-bold text-xs uppercase px-6">Ir al Catálogo</Button>
                </Link>
              </Card>
            ) : (
              pedidos.map((pedido) => {
                const pasoActual = getPasoActual(pedido.estado);

                return (
                  <Card key={pedido.id} className="bg-white border-zinc-200 shadow-sm overflow-hidden">
                    
                    <CardHeader className="bg-zinc-50 border-b p-4 flex flex-row justify-between items-center">
                      <div>
                        <CardTitle className="text-sm font-bold text-[#073b78]">
                          Pedido #{pedido.id.slice(0, 8)}
                        </CardTitle>
                        <CardDescription className="text-[11px]">
                          {new Date(pedido.created_at).toLocaleString('es-CO')}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <span className="font-serif font-black text-lg text-green-700">
                          ${pedido.total.toLocaleString('es-CO')}
                        </span>
                        <p className="text-[10px] text-zinc-400 uppercase font-bold">{pedido.metodo_pago || 'Efectivo'}</p>
                      </div>
                    </CardHeader>

                    <CardContent className="p-6 space-y-6 text-xs">
                      
                      {/* LÍNEA DE TIEMPO */}
                      <div className="py-2">
                        <p className="text-[10px] text-zinc-400 font-bold uppercase mb-4 tracking-wider">Estado del Envío:</p>
                        <div className="relative flex items-center justify-between">
                          <div className="absolute top-1/2 left-0 w-full h-1 bg-zinc-200 -translate-y-1/2 z-0" />
                          <div
                            className="absolute top-1/2 left-0 h-1 bg-[#073b78] -translate-y-1/2 z-0 transition-all duration-500"
                            style={{ width: `${(pasoActual / (ESTADOS_TIMELINE.length - 1)) * 100}%` }}
                          />

                          {ESTADOS_TIMELINE.map((item, idx) => {
                            const Icono = item.icono;
                            const completado = idx <= pasoActual;
                            const esActual = idx === pasoActual;

                            return (
                              <div key={item.clave} className="relative z-10 flex flex-col items-center">
                                <div
                                  className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                                    completado
                                      ? 'bg-[#073b78] border-[#073b78] text-white shadow-md'
                                      : 'bg-white border-zinc-300 text-zinc-400'
                                  } ${esActual ? 'ring-4 ring-blue-100 scale-110' : ''}`}
                                >
                                  <Icono className="w-4 h-4" />
                                </div>
                                <span className={`text-[10px] font-bold mt-2 whitespace-nowrap ${completado ? 'text-[#073b78]' : 'text-zinc-400'}`}>
                                  {item.etiqueta}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="border-t pt-3 border-zinc-100 text-zinc-600">
                        <p className="font-bold text-zinc-800">Dirección de Entrega:</p>
                        <p>{pedido.direccion}</p>
                      </div>

                      {pedido.detalle_pedidos && pedido.detalle_pedidos.length > 0 && (
                        <div className="border-t pt-3 border-zinc-100">
                          <p className="text-[10px] text-zinc-400 font-bold uppercase mb-2">Detalle de Productos:</p>
                          <ul className="space-y-1.5 bg-zinc-50 p-3 rounded border border-zinc-200">
                            {pedido.detalle_pedidos.map((item) => (
                              <li key={item.id} className="flex justify-between items-center font-medium">
                                <span>{item.cantidad}x {item.productos?.nombre || 'Producto'}</span>
                                <span className="font-bold text-zinc-700">${(item.precio_unitario * item.cantidad).toLocaleString('es-CO')}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {/* PESTAÑA DIRECCIONES */}
        {tab === 'direcciones' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-serif text-2xl font-bold text-[#073b78]">Mis Direcciones de Entrega</h2>
                <p className="text-xs text-zinc-500">Guarda tus ubicaciones frecuentes para realizar compras rápidamente.</p>
              </div>

              <Button 
                onClick={() => setModalNuevaDir(!modalNuevaDir)}
                className="bg-[#073b78] hover:bg-[#052d5e] text-white text-xs font-bold gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Nueva Dirección
              </Button>
            </div>

            {modalNuevaDir && (
              <Card className="bg-white border-blue-200 shadow-md p-6">
                <form onSubmit={handleAgregarDireccion} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-zinc-700 block mb-1">Nombre / Etiqueta</label>
                      <Input placeholder="Ej: Casa, Trabajo, Finca" required value={etiquetaDir} onChange={e => setEtiquetaDir(e.target.value)} />
                    </div>
                    <div>
                      <label className="font-bold text-zinc-700 block mb-1">Ciudad</label>
                      <select 
                        value={ciudadDir} 
                        onChange={e => setCiudadDir(e.target.value)}
                        className="w-full border border-zinc-300 p-2.5 rounded text-xs bg-white font-medium"
                      >
                        <option value="Barranquilla">Barranquilla</option>
                        <option value="Soledad">Soledad</option>
                        <option value="Cartagena">Cartagena</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-zinc-700 block mb-1">Dirección Exacta</label>
                    <Input placeholder="Ej: Cra 53 # 82-12" required value={textoDir} onChange={e => setTextoDir(e.target.value)} />
                  </div>

                  <div>
                    <label className="font-bold text-zinc-700 block mb-1">Datos Adicionales (Apto, Torre, Casa)</label>
                    <Input placeholder="Ej: Apto 402 Torre B" value={datosAdicDir} onChange={e => setDatosAdicDir(e.target.value)} />
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <Button type="button" variant="outline" onClick={() => setModalNuevaDir(false)}>Cancelar</Button>
                    <Button type="submit" className="bg-[#073b78] text-white">Guardar Dirección</Button>
                  </div>
                </form>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {direcciones.map(d => (
                <Card key={d.id} className="bg-white border-zinc-200 p-5 shadow-sm relative flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#073b78] text-sm">{d.etiqueta}</span>
                      <span className="bg-zinc-100 text-zinc-600 text-[10px] px-2 py-0.5 font-semibold rounded">{d.ciudad}</span>
                    </div>
                    <p className="font-bold text-zinc-900 text-sm">{d.direccion}</p>
                    {d.datos_adicionales && <p className="text-xs text-zinc-500">{d.datos_adicionales}</p>}
                  </div>

                  <button onClick={() => eliminarDireccion(d.id)} className="text-zinc-400 hover:text-red-600 p-1 cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </Card>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}