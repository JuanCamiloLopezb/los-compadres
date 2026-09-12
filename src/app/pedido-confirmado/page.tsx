'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, Truck, Package, ShoppingBag, ArrowLeft, MapPin, Phone, CreditCard } from 'lucide-react';
import Link from 'next/link';

function ContenidoPedidoConfirmado() {
  const searchParams = useSearchParams();
  const pedidoId = searchParams.get('id');

  const [pedido, setPedido] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function cargarPedido() {
      if (!pedidoId) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('pedidos')
        .select('*, detalle_pedidos(*, productos(nombre, imagen_url))')
        .eq('id', pedidoId)
        .single();

      if (data) setPedido(data);
      setLoading(false);
    }

    cargarPedido();
  }, [pedidoId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center font-bold text-[#073b78] text-sm">
        Cargando resumen de tu pedido... 🍺
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="min-h-screen bg-[#fafaf8] flex flex-col items-center justify-center p-6 text-center">
        <Card className="max-w-md p-8 bg-white border-zinc-200 shadow-sm">
          <ShoppingBag className="w-12 h-12 text-[#073b78] mx-auto mb-4 stroke-1" />
          <h2 className="font-serif text-2xl font-bold mb-2">No se encontró el pedido</h2>
          <p className="text-xs text-zinc-500 mb-6">El enlace especificado no contiene una orden válida.</p>
          <Link href="/">
            <Button className="bg-[#073b78] text-white font-bold text-xs uppercase px-6">Ir al Catálogo</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf8] text-zinc-900 font-sans pb-16">
      
      {/* Header Institucional */}
      <header className="bg-[#073b78] text-white py-4 px-6 shadow-md flex justify-between items-center">
        <Link href="/" className="flex items-center gap-3">
          <img src="/logo-el-compadre.jpe" alt="El Compadre" className="h-10 w-auto rounded-full border border-white/20" />
          <span className="font-serif text-lg font-bold">El Compadre</span>
        </Link>

        <Link href="/">
          <Button variant="outline" className="text-white border-white/30 hover:bg-white/10 text-xs gap-1">
            <ArrowLeft className="w-4 h-4" /> Volver a la Tienda
          </Button>
        </Link>
      </header>

      <main className="max-w-3xl mx-auto p-6 mt-6 space-y-6">
        
        {/* Banner de Éxito */}
        <Card className="bg-white border-green-200 border-2 shadow-sm p-6 text-center">
          <CheckCircle2 className="w-14 h-14 text-green-600 mx-auto mb-3" />
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-zinc-900">
            ¡Gracias por tu compra!
          </h1>
          <p className="text-xs text-zinc-600 mt-1">
            Tu pedido ha sido recibido y ya está registrado en nuestro sistema de despacho.
          </p>
          <div className="mt-4 inline-block bg-blue-50 text-[#073b78] px-4 py-2 rounded-full font-mono text-xs font-bold border border-blue-200">
            Número de Pedido: #{pedido.id.slice(0, 8)}
          </div>
        </Card>

        {/* Resumen del Estado y Envío */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Estado de Pedido y Pago */}
          <Card className="bg-white border-zinc-200 shadow-sm p-5 space-y-4">
            <h3 className="font-serif text-base font-bold text-[#073b78] border-b pb-2 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#b88a3b]" /> Estado de la Orden
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center bg-zinc-50 p-2.5 rounded border border-zinc-200">
                <span className="text-zinc-500 font-semibold">Estado de Envío:</span>
                <span className="font-bold text-[#073b78] uppercase">{pedido.estado || 'PENDIENTE'}</span>
              </div>

              <div className="flex justify-between items-center bg-zinc-50 p-2.5 rounded border border-zinc-200">
                <span className="text-zinc-500 font-semibold">Método de Pago:</span>
                <span className="font-bold text-zinc-900 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-[#073b78]" /> {pedido.metodo_pago || 'Efectivo'}
                </span>
              </div>

              <div className="flex justify-between items-center bg-zinc-50 p-2.5 rounded border border-zinc-200">
                <span className="text-zinc-500 font-semibold">Monto Total:</span>
                <span className="font-serif font-black text-base text-green-700">
                  ${pedido.total.toLocaleString('es-CO')}
                </span>
              </div>
            </div>
          </Card>

          {/* Datos de Entrega */}
          <Card className="bg-white border-zinc-200 shadow-sm p-5 space-y-4">
            <h3 className="font-serif text-base font-bold text-[#073b78] border-b pb-2 flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#b88a3b]" /> Dirección de Entrega
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#073b78] shrink-0 mt-0.5" />
                <p className="font-bold text-zinc-800">{pedido.direccion}</p>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-zinc-100">
                <Phone className="w-4 h-4 text-[#073b78] shrink-0" />
                <p className="font-medium text-zinc-700">Teléfono: {pedido.telefono}</p>
              </div>
            </div>
          </Card>

        </div>

        {/* Detalle de Productos */}
        <Card className="bg-white border-zinc-200 shadow-sm p-6 space-y-4">
          <h3 className="font-serif text-base font-bold text-[#073b78] border-b pb-2">
            Licores Solicitados
          </h3>

          <div className="space-y-3">
            {pedido.detalle_pedidos?.map((item: any) => (
              <div key={item.id} className="flex justify-between items-center text-xs border-b pb-2 border-zinc-100">
                <div>
                  <p className="font-bold text-zinc-900">{item.cantidad}x {item.productos?.nombre || 'Producto'}</p>
                  <p className="text-[10px] text-zinc-400">Unitario: ${item.precio_unitario.toLocaleString('es-CO')}</p>
                </div>
                <span className="font-bold text-zinc-800">
                  ${(item.precio_unitario * item.cantidad).toLocaleString('es-CO')}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <Link href="/perfil" className="flex-1">
              <Button className="w-full bg-[#073b78] hover:bg-[#052d5e] text-white font-bold text-xs uppercase py-3">
                Seguir Pedido en Mi Perfil
              </Button>
            </Link>

            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full text-xs font-bold uppercase py-3">
                Realizar Otra Compra
              </Button>
            </Link>
          </div>
        </Card>

      </main>
    </div>
  );
}

export default function PedidoConfirmadoPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-bold">Cargando...</div>}>
      <ContenidoPedidoConfirmado />
    </Suspense>
  );
}