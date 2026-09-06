'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useCartStore } from '../store/useCartStore';
import Link from 'next/link';

interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  categoria: string;
  imagen_url: string;
}

export default function Home() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { items, addItem, removeItem, getTotalItems, getTotalPrice } = useCartStore();

  useEffect(() => {
    async function fetchProductos() {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('activo', true)
        .order('categoria', { ascending: true });

      if (error) {
        console.error('Error cargando catálogo:', error);
      } else {
        setProductos(data || []);
      }
      setLoading(false);
    }

    fetchProductos();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center font-bold text-xl text-black">Cargando la cava de Los Compadres... 🥃</div>;
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-24 text-black">
      
      {/* Barra Superior / Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">🥃 Los Compadres</h1>
            <p className="text-xs text-gray-500">Licorería Express</p>
          </div>
          
          {/* Resumen del Carrito en el Header */}
          <div className="bg-blue-50 border border-blue-200 px-4 py-2 rounded-xl flex items-center gap-3">
            <span className="text-sm font-semibold text-blue-900">🛒 {getTotalItems()} productos</span>
            <span className="text-sm font-bold text-green-600">${getTotalPrice().toLocaleString('es-CO')}</span>
          </div>
          {/* Resumen del Carrito en el Header */}
          <Link 
            href="/checkout" 
            className="bg-blue-50 hover:bg-blue-100 border border-blue-200 px-4 py-2 rounded-xl flex items-center gap-3 transition-colors shadow-sm"
          >
            <span className="text-sm font-semibold text-blue-900">🛒 {getTotalItems()} productos</span>
            <span className="text-sm font-bold text-green-600">${getTotalPrice().toLocaleString('es-CO')}</span>
            <span className="bg-blue-600 text-white text-xs px-3 py-1 rounded-md font-bold ml-2 hover:bg-blue-700">
              Ir a pagar
            </span>
          </Link>
        </div>
      </header>

      {/* Contenido Principal */}
      <div className="max-w-6xl mx-auto px-6 mt-8">
        <h2 className="text-3xl font-extrabold text-gray-800 mb-6">Catálogo Disponible</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {productos.map((producto) => {
            // Buscar si ya está en el carrito para mostrar cuántas unidades lleva
            const cartItem = items.find((i) => i.id === producto.id);
            const cantidadEnCarrito = cartItem ? cartItem.cantidad : 0;

            return (
              <div key={producto.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
                
                <div className="h-44 bg-gray-100 flex items-center justify-center relative">
                  <span className="text-6xl">🍾</span>
                  <span className="absolute top-3 right-3 bg-gray-900 text-white text-xs px-2.5 py-1 rounded-full font-bold shadow">
                    {producto.categoria}
                  </span>
                </div>
                
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 text-base line-clamp-1">{producto.nombre}</h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2 min-h-[32px]">{producto.descripcion}</p>
                  </div>
                  
                  <div className="mt-6">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-lg font-black text-green-600">
                        ${producto.precio.toLocaleString('es-CO')}
                      </span>
                      <span className="text-xs text-gray-400 font-medium">Stock: {producto.stock}</span>
                    </div>

                    {/* Controles de Carrito */}
                    {cantidadEnCarrito === 0 ? (
                      <button 
                        onClick={() => addItem(producto)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-all active:scale-95 text-sm"
                      >
                        Agregar al Carrito
                      </button>
                    ) : (
                      <div className="flex items-center justify-between bg-gray-100 p-1.5 rounded-xl border border-gray-200">
                        <button 
                          onClick={() => removeItem(producto.id)}
                          className="w-9 h-9 bg-white rounded-lg shadow-sm font-bold text-gray-700 hover:bg-gray-200 transition-colors flex items-center justify-center"
                        >
                          -
                        </button>
                        <span className="font-bold text-gray-900 text-sm">{cantidadEnCarrito} en carrito</span>
                        <button 
                          onClick={() => addItem(producto)}
                          className="w-9 h-9 bg-blue-600 text-white rounded-lg shadow-sm font-bold hover:bg-blue-700 transition-colors flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

    </main>
  );
}