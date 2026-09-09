'use client';

import { useState } from 'react';
import { useCartStore } from '../store/useCartStore';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

export function CartDrawer() {
  const { 
    items, 
    addItem, 
    removeItem, 
    deleteItem, 
    getSubtotal, 
    getMontoDescuento, 
    getTotalPrice, 
    getTotalItems,
    aplicarCupon,
    calcularEnvio,
    codigoCupon,
    costoEnvio,
    direccionEnvio
  } = useCartStore();

  const [inputCupon, setInputCupon] = useState('');
  const [mensajeCupon, setMensajeCupon] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  const handleAplicarCupon = () => {
    const exito = aplicarCupon(inputCupon);
    if (exito) {
      setMensajeCupon({ tipo: 'ok', texto: '¡Cupon aplicado con éxito!' });
      setInputCupon('');
    } else {
      setMensajeCupon({ tipo: 'error', texto: 'Cupón inválido o expirado.' });
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative font-bold border-zinc-300">
          🛒 Carrito
          {getTotalItems() > 0 && (
            <span className="ml-2 bg-black text-white text-xs px-2 py-0.5 rounded-full font-extrabold">
              {getTotalItems()}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-md flex flex-col justify-between bg-white text-zinc-900 p-6">
        <SheetHeader>
          <SheetTitle className="text-2xl font-black text-zinc-900 flex justify-between items-center">
            <span>Tu Pedido</span>
            <span className="text-sm font-semibold text-zinc-500">{getTotalItems()} productos</span>
          </SheetTitle>
        </SheetHeader>

        {/* Lista de Productos */}
        <div className="flex-1 overflow-y-auto my-4 space-y-4 pr-1">
          {items.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 font-medium">
              Tu carrito está vacío 🍾<br />¡Agrega tus licores favoritos!
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <div className="flex-1 pr-3">
                  <h4 className="font-bold text-sm text-zinc-800">{item.nombre}</h4>
                  <p className="text-xs text-green-600 font-bold">${item.precio.toLocaleString('es-CO')}</p>
                </div>

                {/* Controles + / - */}
                <div className="flex items-center gap-2 bg-zinc-100 rounded-lg p-1">
                  <button onClick={() => removeItem(item.id)} className="w-6 h-6 bg-white font-bold rounded shadow-sm hover:bg-zinc-200">-</button>
                  <span className="text-xs font-bold w-4 text-center">{item.cantidad}</span>
                  <button onClick={() => addItem(item)} className="w-6 h-6 bg-black text-white font-bold rounded shadow-sm hover:bg-zinc-800">+</button>
                </div>

                <button onClick={() => deleteItem(item.id)} className="ml-3 text-xs text-red-500 font-bold hover:underline">
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="space-y-4 border-t border-zinc-200 pt-4">
            
            {/* Campo Dirección para Cotizar Domicilio */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-700">Dirección para calcular domicilio</label>
              <Input 
                placeholder="Ej: Calle 100 # 15-20 (Norte)" 
                value={direccionEnvio}
                onChange={(e) => calcularEnvio(e.target.value)}
                className="text-xs"
              />
            </div>

            {/* Campo Cupón de Descuento */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-700">¿Tienes un cupón?</label>
              <div className="flex gap-2">
                <Input 
                  placeholder="Ej: COMPADRES10" 
                  value={inputCupon}
                  onChange={(e) => setInputCupon(e.target.value)}
                  className="text-xs uppercase"
                />
                <Button size="sm" onClick={handleAplicarCupon} variant="secondary" className="font-bold">
                  Aplicar
                </Button>
              </div>
              {mensajeCupon && (
                <p className={`text-xs font-semibold mt-1 ${mensajeCupon.tipo === 'ok' ? 'text-green-600' : 'text-red-500'}`}>
                  {mensajeCupon.texto}
                </p>
              )}
              {codigoCupon && (
                <span className="inline-block bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded mt-1">
                  Cupón activo: {codigoCupon}
                </span>
              )}
            </div>

            {/* Desglose de Precios */}
            <div className="space-y-1.5 text-xs text-zinc-600 pt-2 border-t border-zinc-100">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-semibold text-zinc-900">${getSubtotal().toLocaleString('es-CO')}</span>
              </div>

              {getMontoDescuento() > 0 && (
                <div className="flex justify-between text-green-600 font-bold">
                  <span>Descuento:</span>
                  <span>-${getMontoDescuento().toLocaleString('es-CO')}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Domicilio:</span>
                <span className="font-semibold text-zinc-900">
                  {costoEnvio === 0 ? 'Ingresa dirección' : `$${costoEnvio.toLocaleString('es-CO')}`}
                </span>
              </div>

              <div className="flex justify-between text-base font-black text-zinc-900 pt-2 border-t border-zinc-200">
                <span>Total:</span>
                <span className="text-green-600">${getTotalPrice().toLocaleString('es-CO')}</span>
              </div>
            </div>

            {/* Botón Ir a Checkout */}
            <SheetFooter>
              <Link href="/checkout" className="w-full">
                <Button className="w-full font-bold bg-green-600 hover:bg-green-700 text-white py-6 text-base">
                  Proceder al Pago
                </Button>
              </Link>
            </SheetFooter>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}