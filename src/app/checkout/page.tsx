'use client';

import { useState, useEffect } from 'react';
import { useCartStore } from '../../store/useCartStore';
import { supabase } from '../../lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, CreditCard, ShieldCheck, Truck, ShoppingBag, Banknote, CheckCircle2, MapPin, Ticket } from 'lucide-react';
import Link from 'next/link';

interface DireccionGuardada {
  id: string;
  etiqueta: string;
  ciudad: string;
  direccion: string;
  datos_adicionales?: string;
}

const TARIFAS_DOMICILIO: Record<string, number> = {
  Barranquilla: 5000,
  Soledad: 6000,
  Cartagena: 10000,
};

export default function CheckoutPage() {
  const { items, getTotalPrice, clearCart } = useCartStore();

  const [usuario, setUsuario] = useState<any>(null);
  const [direccionesGuardadas, setDireccionesGuardadas] = useState<DireccionGuardada[]>([]);

  // Formulario
  const [tipoDocumento, setTipoDocumento] = useState('CC');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [telefono, setTelefono] = useState('');
  const [ciudad, setCiudad] = useState('Barranquilla');
  const [direccion, setDireccion] = useState('');
  const [datosAdicionales, setDatosAdicionales] = useState('');
  const [comentarios, setComentarios] = useState('');

  // Cupones
  const [codigoCuponInput, setCodigoCuponInput] = useState('');
  const [cuponAplicado, setCuponAplicado] = useState<{ codigo: string; porcentaje: number } | null>(null);
  const [errorCupon, setErrorCupon] = useState('');
  const [validandoCupon, setValidandoCupon] = useState(false);

  // Método de pago
  const [metodoPago, setMetodoPago] = useState<'epayco' | 'efectivo'>('epayco');
  const [procesando, setProcesando] = useState(false);
  const [scriptCargado, setScriptCargado] = useState(false);

  // Totales
  const subtotalProductos = getTotalPrice();
  const costoDomicilio = TARIFAS_DOMICILIO[ciudad] || 5000;
  const montoDescuento = cuponAplicado ? (subtotalProductos * cuponAplicado.porcentaje) / 100 : 0;
  const totalFinal = Math.max(0, subtotalProductos - montoDescuento + costoDomicilio);

  useEffect(() => {
    async function cargarUsuarioYDirecciones() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUsuario(user);

        const { data: perf } = await supabase.from('perfiles').select('*').eq('id', user.id).single();
        if (perf) {
          if (perf.nombre) {
            const partes = perf.nombre.split(' ');
            setNombres(partes[0] || '');
            setApellidos(partes.slice(1).join(' ') || '');
          }
          if (perf.telefono) setTelefono(perf.telefono);
        }

        const { data: dirs } = await supabase.from('direcciones').select('*').eq('usuario_id', user.id);
        if (dirs && dirs.length > 0) {
          setDireccionesGuardadas(dirs);
          const pred = dirs.find(d => d.es_predeterminada) || dirs[0];
          if (pred) {
            setCiudad(pred.ciudad);
            setDireccion(pred.direccion);
            setDatosAdicionales(pred.datos_adicionales || '');
          }
        }
      }
    }

    cargarUsuarioYDirecciones();

    const script = document.createElement('script');
    script.src = 'https://checkout.epayco.co/checkout.js';
    script.async = true;
    script.onload = () => setScriptCargado(true);
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleValidarCupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigoCuponInput.trim()) return;

    setValidandoCupon(true);
    setErrorCupon('');

    const { data: cupon, error } = await supabase
      .from('cupones')
      .select('*')
      .eq('codigo', codigoCuponInput.trim().toUpperCase())
      .single();

    if (error || !cupon) {
      setErrorCupon('Cupón inválido o expirado');
      setCuponAplicado(null);
    } else {
      setCuponAplicado({
        codigo: cupon.codigo,
        porcentaje: cupon.descuento_porcentaje,
      });
      setErrorCupon('');
    }
    setValidandoCupon(false);
  };

  const handleProcesarPedido = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!numeroDocumento || !nombres || !apellidos || !telefono || !direccion) {
      alert('Por favor completa todos los campos obligatorios.');
      return;
    }

    const direccionCompleta = `${direccion} ${datosAdicionales ? `(${datosAdicionales})` : ''} - ${ciudad}`;
    const notasCompletas = `Cliente: ${nombres} ${apellidos} | Doc: ${tipoDocumento} ${numeroDocumento} | Dom: $${costoDomicilio.toLocaleString('es-CO')} | Cupón: ${cuponAplicado ? cuponAplicado.codigo : 'Ninguno'} | Obs: ${comentarios}`;

    // Obtener sesión activa al procesar el pedido
    const { data: { user: sessionUser } } = await supabase.auth.getUser();
    const userId = sessionUser?.id || usuario?.id || null;

    // OPCIÓN A: EFECTIVO CONTRA ENTREGA
    if (metodoPago === 'efectivo') {
      try {
        setProcesando(true);

        const { data: pedido, error: errPedido } = await supabase
          .from('pedidos')
          .insert([{
            usuario_id: userId, // VINCULADO AL USUARIO REGISTRADO
            total: totalFinal,
            estado: 'PENDIENTE DE PAGO',
            metodo_pago: 'Efectivo',
            direccion: direccionCompleta,
            direccion_entrega: direccionCompleta,
            telefono: telefono,
            comentarios: notasCompletas
          }])
          .select()
          .single();

        if (errPedido) throw errPedido;

        const detalles = items.map(item => ({
          pedido_id: pedido.id,
          producto_id: item.id,
          cantidad: item.cantidad,
          precio_unitario: item.precio
        }));

        await supabase.from('detalle_pedidos').insert(detalles);

        for (const item of items) {
          const { data: prod } = await supabase.from('productos').select('stock').eq('id', item.id).single();
          if (prod) {
            const nuevoStock = Math.max(0, prod.stock - item.cantidad);
            await supabase.from('productos').update({ stock: nuevoStock }).eq('id', item.id);
          }
        }

        clearCart();
        window.location.href = `/pedido-confirmado?id=${pedido.id}`;

      } catch (err: any) {
        alert('Error registrando el pedido: ' + err.message);
      } finally {
        setProcesando(false);
      }
      return;
    }

    // OPCIÓN B: PASARELA EPAYCO
    const ePayco = (window as any).ePayco;
    if (!ePayco) {
      alert('Cargando la pasarela de pagos. Por favor intenta de nuevo.');
      return;
    }

    const handler = ePayco.checkout.configure({
      key: process.env.NEXT_PUBLIC_EPAYCO_PUBLIC_KEY,
      test: true,
    });

    const data = {
      name: 'Pedido El Compadre',
      description: `Compra de licores a domicilio (${ciudad})`,
      invoice: `PED-${Date.now()}`,
      currency: 'cop',
      amount: totalFinal.toString(),
      tax_base: '0',
      tax: '0',
      country: 'co',
      lang: 'es',
      external: 'false',
      confirmation: `${window.location.origin}/api/epayco/webhook`,
      response: `${window.location.origin}/pedido-confirmado`,
      name_billing: `${nombres} ${apellidos}`,
      number_doc_billing: numeroDocumento,
      type_doc_billing: tipoDocumento,
      mobilephone_billing: telefono,
      address_billing: `${direccion} ${datosAdicionales ? `(${datosAdicionales})` : ''}`,
      methodsDisable: ['CASH'],
    };

    handler.open(data);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#fafaf8] text-zinc-900 font-sans flex flex-col justify-between">
        <header className="bg-[#073b78] text-white py-4 px-6 shadow-md flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo-el-compadre.jpe" alt="El Compadre" className="h-10 w-auto rounded-full border border-white/20" />
            <span className="font-serif text-lg font-bold">El Compadre</span>
          </Link>
        </header>

        <main className="max-w-md mx-auto p-6 text-center">
          <Card className="bg-white border-zinc-200 p-8 shadow-sm">
            <ShoppingBag className="w-12 h-12 text-[#073b78] mx-auto mb-4 stroke-1" />
            <h1 className="font-serif text-2xl font-bold text-zinc-900 mb-2">Tu carrito está vacío</h1>
            <p className="text-xs text-zinc-500 mb-6">Agrega tus productos favoritos desde la tienda para proceder con la entrega.</p>
            <Link href="/">
              <Button className="bg-[#073b78] hover:bg-[#052d5e] text-white font-bold text-xs uppercase px-6">
                Volver al Catálogo
              </Button>
            </Link>
          </Card>
        </main>

        <footer className="bg-[#202020] text-white/50 text-[10px] text-center py-4">
          EL COMPADRE © {new Date().getFullYear()}
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf8] text-zinc-900 font-sans pb-16">
      <header className="bg-[#073b78] text-white py-4 px-6 shadow-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo-el-compadre.jpe" alt="El Compadre" className="h-11 w-auto rounded-full border border-white/20" />
            <div>
              <h1 className="font-serif text-lg font-bold leading-none">El Compadre</h1>
              <p className="text-[10px] text-blue-200 uppercase tracking-widest mt-0.5">Finalizar Pedido</p>
            </div>
          </Link>

          <Link href="/">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 text-xs gap-1">
              <ArrowLeft className="w-4 h-4" /> Volver a la Tienda
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 mt-4">
        <form onSubmit={handleProcesarPedido} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-7 space-y-6">
            <Card className="bg-white border-zinc-200 shadow-sm">
              <CardHeader className="bg-[#073b78] text-white rounded-t-xl py-4">
                <CardTitle className="font-serif text-lg flex items-center gap-2">
                  <Truck className="w-5 h-5 text-[#d8c38f]" /> Datos del Comprador y Envío
                </CardTitle>
                <CardDescription className="text-blue-100 text-xs">
                  Ingresa tu información requerida para la facturación y la entrega a domicilio.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6 space-y-4 text-xs">
                {usuario && direccionesGuardadas.length > 0 && (
                  <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-200 mb-2 space-y-1">
                    <label className="font-bold text-[#073b78] text-xs flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" /> Seleccionar una dirección guardada:
                    </label>
                    <select
                      onChange={(e) => {
                        const seleccionada = direccionesGuardadas.find(d => d.id === e.target.value);
                        if (seleccionada) {
                          setCiudad(seleccionada.ciudad);
                          setDireccion(seleccionada.direccion);
                          setDatosAdicionales(seleccionada.datos_adicionales || '');
                        }
                      }}
                      className="w-full border border-blue-300 p-2 rounded text-xs bg-white font-bold text-zinc-800 outline-none focus:ring-2 focus:ring-[#073b78]"
                    >
                      <option value="">-- Usar una dirección de mi perfil --</option>
                      {direccionesGuardadas.map(d => (
                        <option key={d.id} value={d.id}>{d.etiqueta} - {d.direccion} ({d.ciudad})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-zinc-700 block mb-1">Tipo Doc.</label>
                    <select
                      value={tipoDocumento}
                      onChange={(e) => setTipoDocumento(e.target.value)}
                      className="w-full border border-zinc-300 p-2 rounded text-xs bg-white font-medium outline-none focus:border-[#073b78]"
                    >
                      <option value="CC">C.C.</option>
                      <option value="CE">C.E.</option>
                      <option value="NIT">NIT</option>
                      <option value="PP">Pasaporte</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="font-bold text-zinc-700 block mb-1">Número de Documento *</label>
                    <Input
                      required
                      placeholder="Ej: 1040123456"
                      value={numeroDocumento}
                      onChange={(e) => setNumeroDocumento(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-zinc-700 block mb-1">Nombres *</label>
                    <Input
                      required
                      placeholder="Ej: Silvana"
                      value={nombres}
                      onChange={(e) => setNombres(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="font-bold text-zinc-700 block mb-1">Apellidos *</label>
                    <Input
                      required
                      placeholder="Ej: Borrero"
                      value={apellidos}
                      onChange={(e) => setApellidos(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-zinc-700 block mb-1">Teléfono / Celular *</label>
                    <Input
                      required
                      placeholder="Ej: 3001234567"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="font-bold text-zinc-700 block mb-1">Ciudad de Cobertura *</label>
                    <select
                      value={ciudad}
                      onChange={(e) => setCiudad(e.target.value)}
                      className="w-full border border-zinc-300 p-2 rounded text-xs bg-white font-medium outline-none focus:border-[#073b78]"
                    >
                      <option value="Barranquilla">Barranquilla ($5.000 domicilio)</option>
                      <option value="Soledad">Soledad ($6.000 domicilio)</option>
                      <option value="Cartagena">Cartagena ($10.000 domicilio)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Dirección Completa de Entrega *</label>
                  <Input
                    required
                    placeholder="Ej: Calle 45E #15B-81"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                  />
                </div>

                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Datos Adicionales de la Dirección</label>
                  <Input
                    placeholder="Ej: Apto 410, Conjunto Los Olivos"
                    value={datosAdicionales}
                    onChange={(e) => setDatosAdicionales(e.target.value)}
                  />
                </div>

                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Comentarios u Observaciones para el Domiciliario</label>
                  <textarea
                    rows={2}
                    placeholder="Ej: El timbre no sirve, favor llamar al llegar..."
                    value={comentarios}
                    onChange={(e) => setComentarios(e.target.value)}
                    className="w-full border border-zinc-300 p-2.5 rounded text-xs bg-white outline-none focus:border-[#073b78]"
                  />
                </div>

                <div className="pt-4 border-t border-zinc-200">
                  <label className="font-bold text-zinc-800 text-sm block mb-3">Selecciona el Método de Pago *</label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div 
                      onClick={() => setMetodoPago('epayco')}
                      className={`p-4 border rounded-xl cursor-pointer flex items-center justify-between transition-all ${
                        metodoPago === 'epayco' ? 'border-[#073b78] bg-blue-50/50 ring-2 ring-[#073b78]' : 'border-zinc-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-[#073b78]" />
                        <div>
                          <p className="font-bold text-zinc-900 text-xs">Tarjeta / PSE / Nequi</p>
                          <p className="text-[10px] text-zinc-500">Pago en línea con ePayco</p>
                        </div>
                      </div>
                      {metodoPago === 'epayco' && <CheckCircle2 className="w-5 h-5 text-[#073b78]" />}
                    </div>

                    <div 
                      onClick={() => setMetodoPago('efectivo')}
                      className={`p-4 border rounded-xl cursor-pointer flex items-center justify-between transition-all ${
                        metodoPago === 'efectivo' ? 'border-green-600 bg-green-50/50 ring-2 ring-green-600' : 'border-zinc-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Banknote className="w-5 h-5 text-green-700" />
                        <div>
                          <p className="font-bold text-zinc-900 text-xs">Efectivo Contra Entrega</p>
                          <p className="text-[10px] text-zinc-500">Pagas al recibir tu licor</p>
                        </div>
                      </div>
                      {metodoPago === 'efectivo' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <Card className="bg-white border-zinc-200 shadow-sm sticky top-28">
              <CardHeader className="bg-zinc-50 border-b py-4">
                <CardTitle className="font-serif text-lg text-[#073b78] flex items-center justify-between">
                  <span>Resumen del Pedido</span>
                  <span className="text-xs font-sans font-bold bg-[#073b78] text-white px-2 py-0.5 rounded-full">
                    {items.length} ítem(s)
                  </span>
                </CardTitle>
              </CardHeader>

              <CardContent className="p-6 space-y-4 text-xs">
                <div className="space-y-3 max-h-48 overflow-y-auto pr-1 border-b pb-4 border-zinc-100">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center font-medium">
                      <div className="pr-2">
                        <p className="font-bold text-zinc-800">{item.nombre}</p>
                        <p className="text-[10px] text-zinc-400">Cantidad: {item.cantidad}</p>
                      </div>
                      <span className="font-bold text-zinc-900 whitespace-nowrap">
                        ${(item.precio * item.cantidad).toLocaleString('es-CO')}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-b pb-4 border-zinc-100 space-y-2">
                  <label className="font-bold text-zinc-700 text-xs flex items-center gap-1.5">
                    <Ticket className="w-4 h-4 text-[#b88a3b]" /> ¿Tienes un cupón de descuento?
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ej: COMPADRE10"
                      value={codigoCuponInput}
                      onChange={(e) => setCodigoCuponInput(e.target.value)}
                      className="uppercase text-xs font-bold"
                    />
                    <Button 
                      onClick={handleValidarCupon}
                      type="button" 
                      disabled={validandoCupon}
                      className="bg-[#073b78] text-white font-bold text-xs"
                    >
                      {validandoCupon ? '...' : 'Aplicar'}
                    </Button>
                  </div>
                  {cuponAplicado && (
                    <p className="text-green-700 font-bold text-[11px] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Cupón {cuponAplicado.codigo} aplicado (-{cuponAplicado.porcentaje}%)
                    </p>
                  )}
                  {errorCupon && <p className="text-red-600 font-bold text-[11px]">{errorCupon}</p>}
                </div>

                <div className="space-y-2 border-b pb-4 border-zinc-100 text-zinc-600">
                  <div className="flex justify-between">
                    <span>Subtotal Productos:</span>
                    <span className="font-semibold text-zinc-900">${subtotalProductos.toLocaleString('es-CO')}</span>
                  </div>

                  {cuponAplicado && (
                    <div className="flex justify-between text-green-700 font-bold">
                      <span>Descuento ({cuponAplicado.porcentaje}%):</span>
                      <span>-${montoDescuento.toLocaleString('es-CO')}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>Costo de Domicilio ({ciudad}):</span>
                    <span className="font-semibold text-zinc-900">${costoDomicilio.toLocaleString('es-CO')}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center py-1 text-sm">
                  <span className="font-bold text-zinc-800">Total a Pagar:</span>
                  <span className="font-serif text-2xl font-black text-[#073b78]">
                    ${totalFinal.toLocaleString('es-CO')}
                  </span>
                </div>

                {metodoPago === 'epayco' ? (
                  <Button
                    type="submit"
                    disabled={!scriptCargado}
                    className="w-full bg-[#b88a3b] hover:bg-[#a37932] text-white font-bold py-3.5 uppercase tracking-wider text-xs gap-2 shadow-md cursor-pointer transition-colors"
                  >
                    <CreditCard className="w-4 h-4" />
                    {scriptCargado ? 'Pagar de Forma Segura' : 'Cargando Pasarela...'}
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={procesando}
                    className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-3.5 uppercase tracking-wider text-xs gap-2 shadow-md cursor-pointer transition-colors"
                  >
                    <Banknote className="w-4 h-4" />
                    {procesando ? 'Confirmando Pedido...' : 'Confirmar Pedido en Efectivo'}
                  </Button>
                )}

                <div className="flex items-center justify-center gap-2 pt-2 text-zinc-400 text-[10px] font-semibold">
                  <ShieldCheck className="w-4 h-4 text-green-600" />
                  <span>
                    {metodoPago === 'epayco' 
                      ? 'Pagos cifrados y seguros mediante ePayco' 
                      : 'Pagas directamente al domiciliario oficial'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

        </form>
      </main>
    </div>
  );
}