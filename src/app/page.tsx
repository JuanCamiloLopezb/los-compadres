'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useCartStore } from '../store/useCartStore';
import { CartDrawer } from '../components/CartDrawer';
import { Footer } from '../components/Footer';
import { AuthModal } from '../components/AuthModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';

interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  categoria: string;
  imagen_url?: string;
}

const CATEGORIAS = ['Todos', 'Aguardiente', 'Ron', 'Whisky', 'Cervezas', 'Tequila', 'Vinos', 'Snacks'];

export default function Home() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [esAdmin, setEsAdmin] = useState(false);
  const [usuario, setUsuario] = useState<any>(null);

  // Modal Auth
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');
  
  const { items, addItem, removeItem } = useCartStore();

  useEffect(() => {
    async function init() {
      const { data: prods, error } = await supabase
        .from('productos')
        .select('*')
        .eq('activo', true)
        .order('categoria', { ascending: true });

      if (!error) setProductos(prods || []);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUsuario(user);
        if (user.user_metadata?.rol === 'admin') {
          setEsAdmin(true);
        }
      }

      setLoading(false);
    }

    init();
  }, []);

  const handleCerrarSesion = async () => {
    await supabase.auth.signOut();
    setUsuario(null);
    setEsAdmin(false);
    window.location.reload();
  };

  const productosFiltrados = productos.filter((producto) => {
    const coincideCategoria = categoriaSeleccionada === 'Todos' || producto.categoria === categoriaSeleccionada;
    const coincideBusqueda = producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
                             producto.descripcion?.toLowerCase().includes(busqueda.toLowerCase());
    return coincideCategoria && coincideBusqueda;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-bold text-xl text-blue-950 bg-blue-50/50">
        Cargando la cava de El Compadre... 🥃
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col justify-between">
      
      <div>
        {/* Header Principal con la Identidad Azul del Logo */}
        <header className="bg-blue-900 text-white sticky top-0 z-30 shadow-md">
          <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center gap-4">
            
            {/* Branding con el Nombre Institucional */}
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-900 font-black shadow-sm text-xl">
                
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-white leading-tight">
                  El Compadre
                </h1>
                <p className="text-[10px] text-blue-200 font-medium">Licorería Express</p>
              </div>
            </Link>
            
            {/* Acciones */}
            <div className="flex items-center gap-3">
              
              {/* Accesos Admin */}
              {esAdmin && (
                <div className="flex items-center gap-1 bg-blue-800/80 border border-blue-700 p-1 rounded-xl mr-1">
                  <Link href="/admin">
                    <Button variant="ghost" size="sm" className="font-bold text-white text-xs hover:bg-blue-700">
                      📦 Inventario
                    </Button>
                  </Link>
                  <Link href="/admin/pedidos">
                    <Button variant="ghost" size="sm" className="font-bold text-white text-xs hover:bg-blue-700">
                      🛵 Despacho
                    </Button>
                  </Link>
                </div>
              )}

              {/* Botón Carrito */}
              <CartDrawer />

              {/* Icono de Perfil Dinámico */}
              {usuario ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-10 h-10 rounded-full bg-white text-blue-900 hover:bg-blue-50 flex items-center justify-center font-bold shadow-md transition-all">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-white font-medium shadow-lg border-blue-100">
                    <DropdownMenuLabel className="text-xs text-blue-900 font-bold">Mi Cuenta</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href="/perfil" className="flex items-center gap-2">
                        👤 Ver Perfil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href="/mis-pedidos" className="flex items-center gap-2">
                        📦 Mis Pedidos
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleCerrarSesion} className="text-red-600 cursor-pointer font-bold">
                      🚪 Cerrar Sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <button 
                  onClick={() => setAuthModalOpen(true)}
                  className="w-10 h-10 rounded-full bg-white text-blue-900 hover:bg-blue-50 flex items-center justify-center font-bold shadow-md transition-all"
                  title="Iniciar Sesión / Registro"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </button>
              )}

            </div>
          </div>
        </header>

        {/* Modal de Registro e Inicio de Sesión */}
        <AuthModal 
          open={authModalOpen} 
          onOpenChange={setAuthModalOpen} 
        />

        {/* Contenido Principal */}
        <main className="max-w-7xl mx-auto px-6 mt-8 pb-16">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-black text-blue-950">Catálogo de Licores</h2>
              <p className="text-sm text-zinc-500 mt-0.5">Envíos fríos y express directamente a tu puerta</p>
            </div>

            <div className="w-full md:w-72">
              <Input 
                placeholder="🔍 Buscar licor..." 
                value={busqueda} 
                onChange={(e) => setBusqueda(e.target.value)}
                className="bg-white border-blue-200 focus:border-blue-900 font-medium text-sm shadow-sm"
              />
            </div>
          </div>

          {/* Filtro por Categorías */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
            {CATEGORIAS.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoriaSeleccionada(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all shadow-sm ${
                  categoriaSeleccionada === cat
                    ? 'bg-blue-900 text-white shadow-md'
                    : 'bg-white text-blue-950 hover:bg-blue-50 border border-zinc-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Lista de Productos */}
          {productosFiltrados.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-zinc-200 p-8 shadow-sm">
              <p className="text-blue-950 font-bold text-lg">No encontramos productos para esa búsqueda 🍾</p>
              <p className="text-xs text-zinc-400 mt-1">Prueba cambiando la categoría o escribiendo otro nombre.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {productosFiltrados.map((producto) => {
                const cartItem = items.find((i) => i.id === producto.id);
                const cantidadEnCarrito = cartItem ? cartItem.cantidad : 0;

                return (
                  <div key={producto.id} className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
                    
                    <div className="h-48 bg-blue-50/40 flex items-center justify-center relative p-4 border-b border-zinc-100">
                      {producto.imagen_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img 
                          src={producto.imagen_url} 
                          alt={producto.nombre} 
                          className="h-full object-contain hover:scale-105 transition-transform" 
                        />
                      ) : (
                        <span className="text-6xl">🍾</span>
                      )}
                      
                      <span className="absolute top-3 right-3 bg-blue-900 text-white text-[10px] px-2.5 py-0.5 rounded-full font-bold shadow-sm">
                        {producto.categoria}
                      </span>
                    </div>
                    
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-blue-950 text-base line-clamp-1">{producto.nombre}</h3>
                        <p className="text-xs text-zinc-500 mt-1 line-clamp-2 min-h-[32px]">{producto.descripcion}</p>
                      </div>
                      
                      <div className="mt-6">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-lg font-black text-blue-900">
                            ${producto.precio.toLocaleString('es-CO')}
                          </span>
                          <span className="text-xs text-zinc-400 font-medium">Stock: {producto.stock}</span>
                        </div>

                        {cantidadEnCarrito === 0 ? (
                          <Button 
                            onClick={() => addItem(producto)}
                            className="w-full font-bold text-sm bg-blue-900 hover:bg-blue-950 text-white shadow"
                          >
                            Agregar al Carrito
                          </Button>
                        ) : (
                          <div className="flex items-center justify-between bg-blue-50/60 p-1.5 rounded-xl border border-blue-200">
                            <button 
                              onClick={() => removeItem(producto.id)}
                              className="w-9 h-9 bg-white rounded-lg shadow-sm font-bold text-blue-900 hover:bg-blue-100 transition-colors flex items-center justify-center border border-blue-100"
                            >
                              -
                            </button>
                            <span className="font-bold text-blue-950 text-sm">{cantidadEnCarrito} en carrito</span>
                            <button 
                              onClick={() => addItem(producto)}
                              className="w-9 h-9 bg-blue-900 text-white rounded-lg shadow-sm font-bold hover:bg-blue-950 transition-colors flex items-center justify-center"
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
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}