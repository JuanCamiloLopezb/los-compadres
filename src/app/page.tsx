'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useCartStore } from '../store/useCartStore';
import { CartDrawer } from '../components/CartDrawer';
import { AuthModal } from '../components/AuthModal';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  UserRound, 
  ChevronDown, 
  ArrowRight, 
  Wine, 
  Beer, 
  Martini, 
  GlassWater,
  User,
  Package,
  LogOut
} from 'lucide-react';
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

const CATEGORIAS_HERO = [
  { nombre: 'Whisky', icono: GlassWater },
  { nombre: 'Ron', icono: Wine },
  { nombre: 'Aguardiente', icono: Martini },
  { nombre: 'Cervezas', icono: Beer },
];

export default function Home() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [esAdmin, setEsAdmin] = useState(false);
  const [usuario, setUsuario] = useState<any>(null);
  
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [menuPerfilAbierto, setMenuPerfilAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('Todos');

  const { items, addItem, removeItem } = useCartStore();

  useEffect(() => {
    async function init() {
      const { data: prods } = await supabase
        .from('productos')
        .select('*')
        .eq('activo', true)
        .order('categoria', { ascending: true });

      setProductos(prods || []);

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

  const productosFiltrados = productos.filter((p) => {
    const coincideCategoria = categoriaActiva === 'Todos' || p.categoria.toLowerCase() === categoriaActiva.toLowerCase();
    const coincideBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    return coincideCategoria && coincideBusqueda;
  });

  return (
    <div className="min-h-screen bg-[#fafaf8] text-[#202020] font-sans">
      
      {/* 1. FRANJA SUPERIOR NEGRA */}
      <div className="bg-[#202020] text-white py-2 text-center text-[10px] sm:text-xs tracking-[0.2em] uppercase font-medium">
        ENVÍOS RÁPIDOS • PRODUCTOS SELECCIONADOS • COMPRA SEGURA
      </div>

      {/* 2. HEADER AZUL INSTITUCIONAL */}
      <header className="bg-[#073b78] text-white sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-6">
          
          {/* Logo Oficial */}
          <Link href="/" className="flex items-center gap-3">
            <img 
              src="/logo-el-compadre.jpe" 
              alt="El Compadre" 
              className="h-12 w-auto object-contain rounded-full border border-white/20"
            />
          </Link>

          {/* Buscador Central */}
          <div className="flex-1 max-w-md relative hidden md:block">
            <input 
              type="text"
              placeholder="Buscar productos..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-transparent border border-white/30 rounded-none px-4 py-2 text-sm text-white placeholder:text-white/70 outline-none focus:border-white transition-colors"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/70" />
          </div>

          {/* Iconos de Acción */}
          <div className="flex items-center gap-4">
            {esAdmin && (
              <Link href="/admin">
                <Button variant="ghost" size="sm" className="text-white text-xs font-bold hover:bg-white/10">
                  📦 Admin
                </Button>
              </Link>
            )}

            {/* Menú Desplegable de Perfil (Sin incompatibilidad con Base UI) */}
            {usuario ? (
              <div className="relative">
                <button 
                  onClick={() => setMenuPerfilAbierto(!menuPerfilAbierto)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors outline-none cursor-pointer flex items-center justify-center"
                >
                  <UserRound className="w-5 h-5 text-white" />
                </button>

                {menuPerfilAbierto && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-zinc-200 py-2 text-zinc-900 z-50 text-xs">
                    <div className="px-4 py-1.5 font-bold text-zinc-400 uppercase text-[10px]">Mi Cuenta</div>
                    <div className="border-t border-zinc-100 my-1" />
                    
                    <Link 
                      href="/perfil" 
                      onClick={() => setMenuPerfilAbierto(false)}
                      className="flex items-center gap-2 px-4 py-2 hover:bg-zinc-50 font-medium text-zinc-700"
                    >
                      <User className="w-4 h-4 text-[#073b78]" /> Ver Perfil
                    </Link>

                    <Link 
                      href="/perfil" 
                      onClick={() => setMenuPerfilAbierto(false)}
                      className="flex items-center gap-2 px-4 py-2 hover:bg-zinc-50 font-medium text-zinc-700"
                    >
                      <Package className="w-4 h-4 text-[#073b78]" /> Mis Pedidos
                    </Link>

                    <div className="border-t border-zinc-100 my-1" />
                    
                    <button 
                      onClick={handleCerrarSesion}
                      className="w-full text-left flex items-center gap-2 px-4 py-2 hover:bg-red-50 text-red-600 font-bold cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" /> Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={() => setAuthModalOpen(true)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors outline-none cursor-pointer"
                title="Iniciar Sesión"
              >
                <UserRound className="w-5 h-5 text-white" />
              </button>
            )}

            {/* Carrito Lateral */}
            <CartDrawer />
          </div>

        </div>

        {/* Menú Navegación Inferior */}
        <nav className="border-t border-white/10 bg-[#073b78] hidden md:block">
          <div className="max-w-7xl mx-auto px-6 flex items-center gap-8 h-10 text-[11px] uppercase tracking-[0.15em] text-white/90">
            <button onClick={() => setCategoriaActiva('Todos')} className="hover:text-[#d8c38f] transition-colors cursor-pointer">INICIO</button>
            <button onClick={() => setCategoriaActiva('Whisky')} className="flex items-center gap-1 hover:text-[#d8c38f] transition-colors cursor-pointer">WHISKY <ChevronDown className="w-3 h-3"/></button>
            <button onClick={() => setCategoriaActiva('Ron')} className="flex items-center gap-1 hover:text-[#d8c38f] transition-colors cursor-pointer">RON <ChevronDown className="w-3 h-3"/></button>
            <button onClick={() => setCategoriaActiva('Aguardiente')} className="flex items-center gap-1 hover:text-[#d8c38f] transition-colors cursor-pointer">AGUARDIENTE <ChevronDown className="w-3 h-3"/></button>
            <button onClick={() => setCategoriaActiva('Cervezas')} className="flex items-center gap-1 hover:text-[#d8c38f] transition-colors cursor-pointer">CERVEZAS <ChevronDown className="w-3 h-3"/></button>
            <button onClick={() => setCategoriaActiva('Todos')} className="hover:text-[#d8c38f] transition-colors cursor-pointer">OFERTAS</button>
          </div>
        </nav>
      </header>

      {/* Modal Auth */}
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />

      {/* 3. HERO BANNER PRINCIPAL */}
      <section className="relative min-h-[520px] bg-[#111] overflow-hidden flex items-center">
        <div className="absolute inset-0 z-0">
          <div 
            className="w-full h-full bg-cover bg-center opacity-85 scale-105"
            style={{ 
              backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.1) 100%), url('/hero-bg.jpg')`
            }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 w-full">
          <div className="max-w-xl space-y-6">
            <p className="text-[#d8c38f] text-xs font-semibold tracking-[0.3em] uppercase">
              BIENVENIDO A EL COMPADRE
            </p>

            <h1 className="font-serif text-5xl sm:text-6xl text-white leading-[1.05] tracking-tight">
              El sabor de <br />
              <span className="italic font-serif">compartir.</span>
            </h1>

            <p className="text-white/80 text-sm sm:text-base leading-relaxed max-w-md">
              Descubre nuestra selección de licores, cervezas y bebidas para acompañar tus mejores momentos.
            </p>

            <button 
              onClick={() => document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center gap-3 bg-[#b88a3b] hover:bg-[#a37932] text-white px-7 py-3.5 text-xs font-bold uppercase tracking-[0.15em] transition-all shadow-lg cursor-pointer"
            >
              EXPLORAR PRODUCTOS <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 4. SECCIÓN COMPRA POR CATEGORÍA */}
      <section id="catalogo" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-[#b88a3b] text-xs tracking-[0.3em] uppercase font-bold mb-2">
            EXPLORA NUESTRA SELECCIÓN
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#202020] mb-12">
            Compra por categoría
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {CATEGORIAS_HERO.map((cat) => {
              const Icono = cat.icono;
              return (
                <button
                  key={cat.nombre}
                  onClick={() => setCategoriaActiva(cat.nombre)}
                  className={`p-8 border border-zinc-200 bg-[#fafaf8] flex flex-col items-center justify-center gap-4 hover:border-[#b88a3b] transition-all group cursor-pointer ${
                    categoriaActiva === cat.nombre ? 'border-[#b88a3b] bg-amber-50/20' : ''
                  }`}
                >
                  <Icono className="w-8 h-8 text-[#073b78] group-hover:scale-110 transition-transform" />
                  <span className="font-serif text-lg text-zinc-900">{cat.nombre}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. GRILLA DE PRODUCTOS DEL CATÁLOGO */}
      <section className="py-12 bg-[#fafaf8] border-t border-zinc-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {productosFiltrados.map((producto) => {
              const cartItem = items.find((i) => i.id === producto.id);
              const cantidad = cartItem ? cartItem.cantidad : 0;

              return (
                <div key={producto.id} className="bg-white border border-zinc-200 p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="h-48 bg-zinc-50 flex items-center justify-center p-4 relative mb-4">
                    {producto.imagen_url ? (
                      <img src={producto.imagen_url} alt={producto.nombre} className="h-full object-contain" />
                    ) : (
                      <span className="text-5xl">🍾</span>
                    )}
                    <span className="absolute top-2 right-2 text-[10px] bg-zinc-900 text-white px-2 py-0.5 font-bold uppercase">
                      {producto.categoria}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-serif text-base text-zinc-900 font-bold line-clamp-1">{producto.nombre}</h3>
                    <p className="text-xs text-zinc-500 mt-1 line-clamp-2 min-h-[32px]">{producto.descripcion}</p>
                    <p className="text-lg font-black text-[#073b78] mt-3 mb-4">
                      ${producto.precio.toLocaleString('es-CO')}
                    </p>

                    {cantidad === 0 ? (
                      <button 
                        onClick={() => addItem(producto)}
                        className="w-full bg-[#073b78] hover:bg-[#052d5e] text-white text-xs font-bold uppercase py-2.5 tracking-wider transition-colors cursor-pointer"
                      >
                        Agregar
                      </button>
                    ) : (
                      <div className="flex items-center justify-between border border-zinc-300 p-1">
                        <button onClick={() => removeItem(producto.id)} className="w-8 h-8 font-bold bg-zinc-100 hover:bg-zinc-200 cursor-pointer">-</button>
                        <span className="text-sm font-bold">{cantidad}</span>
                        <button onClick={() => addItem(producto)} className="w-8 h-8 font-bold bg-[#073b78] text-white cursor-pointer">+</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

    </div>
  );
}