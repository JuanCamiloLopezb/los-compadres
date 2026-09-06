'use client';

import { useState, useEffect } from 'react';
import { useCartStore } from '../../store/useCartStore';

export default function Checkout() {
  const { items, getTotalPrice } = useCartStore();
  const [direccion, setDireccion] = useState('');
  const [notas, setNotas] = useState('');
  const [telefono, setTelefono] = useState('');
  const [scriptCargado, setScriptCargado] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.epayco.co/checkout.js';
    script.async = true;
    script.onload = () => setScriptCargado(true);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const abrirEpayco = () => {
    if (!direccion || !telefono) {
      alert("Por favor, ingresa tu teléfono y dirección para el domicilio.");
      return;
    }

    const ePayco = (window as any).ePayco;
    const handler = ePayco.checkout.configure({
      key: process.env.NEXT_PUBLIC_EPAYCO_PUBLIC_KEY,
      test: true // Cambiar a false al pasar a producción
    });

    const data = {
      name: "Pedido Los Compadres",
      description: "Compra de licores - Los Compadres",
      invoice: `PED-${Date.now()}`,
      currency: "cop",
      amount: getTotalPrice().toString(),
      tax_base: "0",
      tax: "0",
      country: "co",
      lang: "es",
      external: "false", // Mantiene el modal dentro de nuestra app
      confirmation: "http://localhost:3000/api/pagos/webhook",
      response: "http://localhost:3000/confirmacion",
      methodsDisable: ["CASH"] // Deshabilita pagos en efectivo en Efecty/Baloto
    };

    handler.open(data);
  };

  if (items.length === 0) {
    return <div className="p-10 text-center font-bold text-black">Tu carrito está vacío.</div>;
  }

  return (
    <main className="max-w-4xl mx-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8 text-black">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <div className="text-2xl font-black mb-6">Datos de Entrega</div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Teléfono</label>
            <input type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} className="w-full border rounded-lg p-2.5" placeholder="Celular para el domiciliario" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Dirección exacta</label>
            <input type="text" value={direccion} onChange={(e) => setDireccion(e.target.value)} className="w-full border rounded-lg p-2.5" placeholder="Ej: Calle 123 # 45-67" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Notas (Opcional)</label>
            <textarea value={notas} onChange={(e) => setNotas(e.target.value)} className="w-full border rounded-lg p-2.5" placeholder="Timbre dañado, dejar en portería..." />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-between">
        <div>
          <div className="text-2xl font-black mb-6">Resumen del Pedido</div>
          <div className="mb-4 flex justify-between font-bold text-xl">
            <span>Total a pagar:</span>
            <span className="text-green-600">${getTotalPrice().toLocaleString('es-CO')}</span>
          </div>
        </div>
        
        <button 
          onClick={abrirEpayco}
          disabled={!scriptCargado}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-bold py-3.5 rounded-xl transition-all"
        >
          {scriptCargado ? 'Pagar de forma segura' : 'Cargando pasarela...'}
        </button>
      </div>
    </main>
  );
}