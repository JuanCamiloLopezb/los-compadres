'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bike, Phone, MapPin, CheckCircle, RefreshCw } from 'lucide-react';

interface Repartidor {
  id: string;
  nombre: string;
  telefono: string;
}

interface Pedido {
  id: string;
  created_at: string;
  total: number;
  estado: string;
  direccion: string;
  telefono: string;
  comentarios?: string;
  metodo_pago?: string;
  detalle_pedidos: any[];
}

export default function RepartidorPage() {
  const [repartidores, setRepartidores] = useState<Repartidor[]>([]);
  const [repartidorSeleccionado, setRepartidorSeleccionado] = useState<string>('');
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  const cargarDatos = async () => {
    setLoading(true);
    const { data: reps } = await supabase.from('repartidores').select('*').eq('activo', true);
    setRepartidores(reps || []);

    if (repartidorSeleccionado) {
      const { data: peds } = await supabase
        .from('pedidos')
        .select('*, detalle_pedidos(*, productos(nombre))')
        .eq('repartidor_id', repartidorSeleccionado)
        .neq('estado', 'PEDIDO ENTREGADO')
        .order('created_at', { ascending: true });

      setPedidos(peds || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    cargarDatos();
  }, [repartidorSeleccionado]);

  const marcarEntregado = async (pedidoId: string) => {
    const ahora = new Date().toISOString();
    await supabase
      .from('pedidos')
      .update({
        estado: 'PEDIDO ENTREGADO',
        fecha_entregado: ahora,
      })
      .eq('id', pedidoId);

    cargarDatos();
  };

  return (
    <div className="min-h-screen bg-[#fafaf8] text-zinc-900 pb-12 font-sans">
      {/* Header Móvil */}
      <header className="bg-[#073b78] text-white p-4 sticky top-0 z-30 shadow-md flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Bike className="w-6 h-6 text-[#d8c38f]" />
          <h1 className="font-serif text-lg font-bold">El Compadre Express</h1>
        </div>
        <Button onClick={cargarDatos} variant="ghost" size="sm" className="text-white p-2 hover:bg-white/10">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </header>

      <div className="p-4 max-w-md mx-auto space-y-4">
        {/* Selector de Repartidor */}
        <Card className="bg-white border-zinc-200 shadow-sm">
          <CardContent className="p-4">
            <label className="text-xs font-bold uppercase text-zinc-500 block mb-2">Selecciona tu Perfil:</label>
            <select
              value={repartidorSeleccionado}
              onChange={(e) => setRepartidorSeleccionado(e.target.value)}
              className="w-full border border-zinc-300 p-2.5 rounded-lg font-bold bg-white text-sm focus:ring-2 focus:ring-[#073b78]"
            >
              <option value="">-- Elige quién eres --</option>
              {repartidores.map((r) => (
                <option key={r.id} value={r.id}>{r.nombre}</option>
              ))}
            </select>
          </CardContent>
        </Card>

        {/* Lista de Pedidos Asignados */}
        {!repartidorSeleccionado ? (
          <div className="text-center py-12 text-zinc-400 font-medium text-xs">
            Selecciona tu nombre arriba para ver tus domicilios pendientes.
          </div>
        ) : pedidos.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-zinc-200 p-6">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
            <p className="font-bold text-zinc-800 text-sm">¡Sin domicilios pendientes!</p>
            <p className="text-xs text-zinc-400 mt-1">Has entregado todos tus pedidos asignados.</p>
          </div>
        ) : (
          pedidos.map((pedido) => (
            <Card key={pedido.id} className="bg-white border-zinc-200 shadow-md overflow-hidden">
              <CardHeader className="bg-[#073b78] text-white p-3 flex flex-row justify-between items-center">
                <div>
                  <CardTitle className="text-sm font-bold">Pedido #{pedido.id.slice(0, 8)}</CardTitle>
                  <CardDescription className="text-[10px] text-blue-200">
                    {new Date(pedido.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </CardDescription>
                </div>
                <span className="font-bold text-base text-[#d8c38f]">
                  ${pedido.total.toLocaleString('es-CO')}
                </span>
              </CardHeader>

              <CardContent className="p-4 space-y-3 text-xs">
                {/* Datos de Entrega */}
                <div className="space-y-1.5 border-b pb-3 border-zinc-100">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-[#073b78] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-zinc-400 font-bold uppercase">Dirección</p>
                      <p className="font-bold text-zinc-800 text-sm">{pedido.direccion}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Phone className="w-4 h-4 text-[#073b78] shrink-0" />
                    <div className="flex items-center justify-between w-full">
                      <span className="font-semibold text-zinc-700">{pedido.telefono}</span>
                      <a
                        href={`https://wa.me/57${pedido.telefono}?text=Hola,%20soy%20el%20domiciliario%20de%20El%20Compadre,%20voy%20en%20camino%20con%20tu%20pedido.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-green-600 text-white text-[10px] px-2.5 py-1 rounded font-bold hover:bg-green-700"
                      >
                        WhatsApp
                      </a>
                    </div>
                  </div>
                </div>

                {/* Resumen de Productos */}
                <div>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase mb-1">Productos a Entregar:</p>
                  <ul className="space-y-1 bg-zinc-50 p-2 rounded border border-zinc-200 text-[11px]">
                    {pedido.detalle_pedidos?.map((item) => (
                      <li key={item.id} className="flex justify-between font-medium">
                        <span>{item.cantidad}x {item.productos?.nombre}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Confirmación */}
                <Button
                  onClick={() => marcarEntregado(pedido.id)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-xs uppercase py-3 mt-2 gap-2"
                >
                  <CheckCircle className="w-4 h-4" /> Marcar como Entregado
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}