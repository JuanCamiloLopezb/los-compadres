'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { ImageUploader } from '../../components/ImageUploader';
import { Package, Bike, Tag, RefreshCw, Printer, ArrowLeft, DollarSign } from 'lucide-react';
import Link from 'next/link';

interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  precio: number;
  precio_costo: number;
  stock: number;
  unidad_medida: string;
  valor_por_unidad: number;
  imagen_url?: string;
}

interface Repartidor {
  id: string;
  nombre: string;
  telefono: string;
  activo: boolean;
}

interface Pedido {
  id: string;
  created_at: string;
  total: number;
  estado: string;
  direccion: string;
  telefono: string;
  repartidor_id?: string;
  metodo_pago?: string;
  detalle_pedidos: any[];
}

export default function AdminDashboardPage() {
  const [tabActiva, setTabActiva] = useState<'productos' | 'pedidos' | 'descuentos' | 'repartidores' | 'cierre'>('productos');
  const [productos, setProductos] = useState<Producto[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [repartidores, setRepartidores] = useState<Repartidor[]>([]);
  const [loading, setLoading] = useState(true);

  // Formulario Producto
  const [modalProd, setModalProd] = useState(false);
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('Aguardiente');
  const [unidadMedida, setUnidadMedida] = useState('ML');
  const [precioFinal, setPrecioFinal] = useState('');
  const [precioCosto, setPrecioCosto] = useState('');
  const [valorPorUnidad, setValorPorUnidad] = useState('');
  const [stock, setStock] = useState('');
  const [imagenUrl, setImagenUrl] = useState('');

  // Formulario Cupones
  const [codigoCupón, setCodigoCupón] = useState('');
  const [porcentajeCupón, setPorcentajeCupón] = useState('');

  // Formulario Repartidores
  const [nomRepartidor, setNomRepartidor] = useState('');
  const [telRepartidor, setTelRepartidor] = useState('');

  // Formulario Cierre de Caja
  const [cajeroNombre, setCajeroNombre] = useState('');
  const [observacionesCierre, setObservacionesCierre] = useState('');

  const cargarDatos = async () => {
    setLoading(true);
    const { data: prods } = await supabase.from('productos').select('*').order('nombre');
    const { data: peds } = await supabase.from('pedidos').select('*, detalle_pedidos(*, productos(nombre))').order('created_at', { ascending: false });
    const { data: reps } = await supabase.from('repartidores').select('*').order('nombre');

    setProductos(prods || []);
    setPedidos(peds || []);
    setRepartidores(reps || []);
    setLoading(false);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleCrearProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('productos').insert([{
      nombre,
      categoria,
      unidad_medida: unidadMedida,
      precio: parseFloat(precioFinal) || 0,
      precio_costo: parseFloat(precioCosto) || 0,
      valor_por_unidad: parseFloat(valorPorUnidad) || 0,
      stock: parseInt(stock) || 0,
      imagen_url: imagenUrl || null,
      activo: true
    }]);
    setModalProd(false);
    cargarDatos();
  };

  const handleCrearCupon = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('cupones').insert([{
      codigo: codigoCupón.toUpperCase(),
      descuento_porcentaje: parseFloat(porcentajeCupón)
    }]);
    setCodigoCupón('');
    setPorcentajeCupón('');
    alert('Cupón creado exitosamente');
  };

  const handleCrearRepartidor = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('repartidores').insert([{
      nombre: nomRepartidor,
      telefono: telRepartidor
    }]);
    setNomRepartidor('');
    setTelRepartidor('');
    cargarDatos();
  };

  const handleActualizarPedido = async (pedidoId: string, nuevoEstado: string, repartidorId?: string) => {
    let updateData: any = { estado: nuevoEstado };
    if (repartidorId) updateData.repartidor_id = repartidorId;

    await supabase.from('pedidos').update(updateData).eq('id', pedidoId);
    cargarDatos();
  };

  const pedidosDelDia = pedidos.filter(p => p.estado === 'PAGADO' || p.estado === 'PEDIDO ENTREGADO');
  const totalRecaudado = pedidosDelDia.reduce((acc, p) => acc + p.total, 0);
  const totalDigital = pedidosDelDia.filter(p => p.metodo_pago !== 'Efectivo').reduce((acc, p) => acc + p.total, 0);
  const totalEfectivo = pedidosDelDia.filter(p => p.metodo_pago === 'Efectivo').reduce((acc, p) => acc + p.total, 0);

  const handleGenerarCierre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cajeroNombre) {
      alert('Ingresa el nombre del cajero para realizar el cierre.');
      return;
    }

    const { error } = await supabase.from('cierres_caja').insert([{
      cajero_nombre: cajeroNombre,
      total_recaudado: totalRecaudado,
      total_efectivo: totalEfectivo,
      total_digital: totalDigital,
      total_pedidos: pedidosDelDia.length,
      observaciones: observacionesCierre
    }]);

    if (error) {
      alert('Error al procesar el cierre: ' + error.message);
    } else {
      alert('¡Cierre diario guardado exitosamente!');
      setCajeroNombre('');
      setObservacionesCierre('');
      cargarDatos();
    }
  };

  const imprimirFactura = (pedido: Pedido) => {
    const ventana = window.open('', '_blank', 'width=400,height=600');
    if (!ventana) return;

    ventana.document.write(`
      <html>
        <head>
          <title>Factura Pedido #${pedido.id.slice(0, 8)}</title>
          <style>
            body { font-family: monospace; padding: 20px; font-size: 12px; }
            .centro { text-align: center; }
            .linea { border-bottom: 1px dashed #000; margin: 10px 0; }
            .flex { display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          <div class="centro">
            <h2>EL COMPADRE</h2>
            <p>Licorería Express<br/>NIT: 900.123.456-7</p>
          </div>
          <div class="linea"></div>
          <p>Pedido: #${pedido.id.slice(0, 8)}</p>
          <p>Fecha: ${new Date(pedido.created_at).toLocaleString()}</p>
          <p>Cliente Tel: ${pedido.telefono}</p>
          <p>Dirección: ${pedido.direccion}</p>
          <div class="linea"></div>
          <h3>DETALLE DE PRODUCTOS</h3>
          ${pedido.detalle_pedidos?.map(i => `
            <div class="flex">
              <span>${i.cantidad}x ${i.productos?.nombre || 'Producto'}</span>
              <span>$${(i.precio_unitario * i.cantidad).toLocaleString('es-CO')}</span>
            </div>
          `).join('')}
          <div class="linea"></div>
          <div class="flex" style="font-weight: bold; font-size: 14px;">
            <span>TOTAL:</span>
            <span>$${pedido.total.toLocaleString('es-CO')}</span>
          </div>
          <div class="linea"></div>
          <p class="centro">¡Gracias por tu compra!</p>
        </body>
      </html>
    `);
    ventana.document.close();
    ventana.print();
  };

  return (
    <div className="min-h-screen bg-[#fafaf8] text-zinc-900 font-sans">
      
      <header className="bg-[#073b78] text-white py-4 px-8 shadow-md flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-white text-[#073b78] font-serif font-black px-3 py-1 text-xl rounded">EC</div>
          <div>
            <h1 className="font-serif text-xl font-bold">Panel de Control & Caja</h1>
            <p className="text-[10px] text-blue-200 uppercase tracking-widest">El Compadre Administrative System</p>
          </div>
        </div>

        <Link href="/">
          <Button variant="outline" className="text-white border-white/30 hover:bg-white/10 text-xs">
            <ArrowLeft className="w-4 h-4 mr-1" /> Volver a la Tienda
          </Button>
        </Link>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-6">

        <div className="flex border-b border-zinc-200 gap-2 overflow-x-auto">
          <button 
            onClick={() => setTabActiva('productos')} 
            className={`flex items-center gap-2 px-5 py-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-all whitespace-nowrap cursor-pointer ${tabActiva === 'productos' ? 'border-[#073b78] text-[#073b78]' : 'border-transparent text-zinc-500'}`}
          >
            <Package className="w-4 h-4" /> Inventario & Medidas
          </button>
          
          <button 
            onClick={() => setTabActiva('pedidos')} 
            className={`flex items-center gap-2 px-5 py-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-all whitespace-nowrap cursor-pointer ${tabActiva === 'pedidos' ? 'border-[#073b78] text-[#073b78]' : 'border-transparent text-zinc-500'}`}
          >
            <RefreshCw className="w-4 h-4" /> Gestión de Pedidos (Caja)
          </button>

          <button 
            onClick={() => setTabActiva('descuentos')} 
            className={`flex items-center gap-2 px-5 py-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-all whitespace-nowrap cursor-pointer ${tabActiva === 'descuentos' ? 'border-[#073b78] text-[#073b78]' : 'border-transparent text-zinc-500'}`}
          >
            <Tag className="w-4 h-4" /> Cupones y Descuentos
          </button>

          <button 
            onClick={() => setTabActiva('repartidores')} 
            className={`flex items-center gap-2 px-5 py-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-all whitespace-nowrap cursor-pointer ${tabActiva === 'repartidores' ? 'border-[#073b78] text-[#073b78]' : 'border-transparent text-zinc-500'}`}
          >
            <Bike className="w-4 h-4" /> Repartidores
          </button>

          <button 
            onClick={() => setTabActiva('cierre')} 
            className={`flex items-center gap-2 px-5 py-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-all whitespace-nowrap cursor-pointer ${tabActiva === 'cierre' ? 'border-[#073b78] text-[#073b78]' : 'border-transparent text-zinc-500'}`}
          >
            <DollarSign className="w-4 h-4" /> Cierre de Caja
          </button>
        </div>

        {tabActiva === 'productos' && (
          <Card className="bg-white border-zinc-200">
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <CardTitle className="font-serif text-2xl text-[#073b78]">Catálogo de Productos</CardTitle>
                <CardDescription>Administra precios, unidades de medida y valores por unidad.</CardDescription>
              </div>

              <Dialog open={modalProd} onOpenChange={setModalProd}>
                <DialogTrigger asChild>
                  <Button className="bg-[#073b78] hover:bg-[#052d5e] text-white font-bold text-xs uppercase tracking-wider">
                    + Nuevo Producto
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="font-serif text-xl">Crear Licor / Producto</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCrearProducto} className="space-y-3 py-2 text-xs">
                    <div>
                      <label className="font-bold">Nombre del Producto</label>
                      <Input required value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Aguardiente Antioqueño 750ml" />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-bold">Categoría</label>
                        <select className="w-full border p-2 rounded" value={categoria} onChange={e => setCategoria(e.target.value)}>
                          <option value="Aguardiente">Aguardiente</option>
                          <option value="Ron">Ron</option>
                          <option value="Whisky">Whisky</option>
                          <option value="Cervezas">Cervezas</option>
                        </select>
                      </div>
                      <div>
                        <label className="font-bold">Unidad de Medida</label>
                        <Input value={unidadMedida} onChange={e => setUnidadMedida(e.target.value)} placeholder="ML o GR" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-bold">Precio Final (Venta)</label>
                        <Input required type="number" value={precioFinal} onChange={e => setPrecioFinal(e.target.value)} placeholder="$ 50000" />
                      </div>
                      <div>
                        <label className="font-bold">Precio Costo</label>
                        <Input required type="number" value={precioCosto} onChange={e => setPrecioCosto(e.target.value)} placeholder="$ 35000" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-bold">Valor por Gr/Ml</label>
                        <Input type="number" value={valorPorUnidad} onChange={e => setValorPorUnidad(e.target.value)} placeholder="Ej: 66.6" />
                      </div>
                      <div>
                        <label className="font-bold">Stock Inicial</label>
                        <Input required type="number" value={stock} onChange={e => setStock(e.target.value)} placeholder="24" />
                      </div>
                    </div>

                    <ImageUploader onImageUploaded={setImagenUrl} />

                    <DialogFooter className="pt-2">
                      <Button type="submit" className="w-full bg-[#073b78] text-white font-bold">Guardar Producto</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Medida</TableHead>
                    <TableHead className="text-right">Valor por Gr/Ml</TableHead>
                    <TableHead className="text-right">Precio Final</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productos.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-bold">{p.nombre}</TableCell>
                      <TableCell>{p.categoria}</TableCell>
                      <TableCell>{p.unidad_medida}</TableCell>
                      <TableCell className="text-right text-zinc-500">${p.valor_por_unidad || 0} / {p.unidad_medida}</TableCell>
                      <TableCell className="text-right font-bold text-[#073b78]">${p.precio.toLocaleString('es-CO')}</TableCell>
                      <TableCell className="text-right font-black">{p.stock}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {tabActiva === 'pedidos' && (
          <div className="space-y-4">
            <h2 className="font-serif text-2xl text-[#073b78] font-bold">Monitor de Pedidos y Despacho</h2>
            {pedidos.map(pedido => (
              <Card key={pedido.id} className="bg-white border-zinc-200 shadow-sm">
                <CardHeader className="bg-zinc-50 flex flex-row justify-between items-center border-b">
                  <div>
                    <CardTitle className="text-base font-bold text-[#073b78]">Pedido #{pedido.id.slice(0, 8)}</CardTitle>
                    <CardDescription>{new Date(pedido.created_at).toLocaleString('es-CO')} | Tel: {pedido.telefono}</CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-serif text-xl font-bold text-green-700">${pedido.total.toLocaleString('es-CO')}</span>
                    <Button onClick={() => imprimirFactura(pedido)} size="sm" variant="outline" className="text-xs font-bold gap-1">
                      <Printer className="w-3.5 h-3.5" /> Factura
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <h4 className="font-bold uppercase text-zinc-400 mb-1">Dirección:</h4>
                    <p className="font-semibold">{pedido.direccion}</p>
                  </div>

                  <div>
                    <h4 className="font-bold uppercase text-zinc-400 mb-1">Estado del Pedido:</h4>
                    <select 
                      value={pedido.estado} 
                      onChange={(e) => handleActualizarPedido(pedido.id, e.target.value, pedido.repartidor_id)}
                      className="w-full border p-2 rounded font-bold bg-white"
                    >
                      <option value="PENDIENTE DE PAGO">PENDIENTE DE PAGO</option>
                      <option value="PAGADO">PAGADO</option>
                      <option value="PEDIDO EN PREPARACION">PEDIDO EN PREPARACIÓN</option>
                      <option value="PEDIDO DESPACHADO">PEDIDO DESPACHADO</option>
                      <option value="PEDIDO ENTREGADO">PEDIDO ENTREGADO</option>
                    </select>
                  </div>

                  <div>
                    <h4 className="font-bold uppercase text-zinc-400 mb-1">Asignar Repartidor:</h4>
                    <select 
                      value={pedido.repartidor_id || ''} 
                      onChange={(e) => handleActualizarPedido(pedido.id, pedido.estado, e.target.value)}
                      className="w-full border p-2 rounded font-bold bg-white"
                    >
                      <option value="">-- Sin Asignar --</option>
                      {repartidores.map(r => (
                        <option key={r.id} value={r.id}>{r.nombre} ({r.telefono})</option>
                      ))}
                    </select>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {tabActiva === 'descuentos' && (
          <Card className="bg-white border-zinc-200 max-w-md mx-auto shadow-sm">
            <CardHeader>
              <CardTitle className="font-serif text-xl text-[#073b78]">Crear Cupones de Descuento</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCrearCupon} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold">Código del Cupón</label>
                  <Input required placeholder="Ej: COMPADRE10" value={codigoCupón} onChange={e => setCodigoCupón(e.target.value)} />
                </div>
                <div>
                  <label className="font-bold">Porcentaje de Descuento (%)</label>
                  <Input required type="number" placeholder="10" value={porcentajeCupón} onChange={e => setPorcentajeCupón(e.target.value)} />
                </div>
                <Button type="submit" className="w-full bg-[#073b78] text-white font-bold">Generar Cupón</Button>
              </form>
            </CardContent>
          </Card>
        )}

        {tabActiva === 'repartidores' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white border-zinc-200 shadow-sm">
              <CardHeader>
                <CardTitle className="font-serif text-xl text-[#073b78]">Nuevo Repartidor</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCrearRepartidor} className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold">Nombre Completo</label>
                    <Input required placeholder="Ej: Carlos Mendoza" value={nomRepartidor} onChange={e => setNomRepartidor(e.target.value)} />
                  </div>
                  <div>
                    <label className="font-bold">Teléfono de Contacto</label>
                    <Input required placeholder="3001234567" value={telRepartidor} onChange={e => setTelRepartidor(e.target.value)} />
                  </div>
                  <Button type="submit" className="w-full bg-[#073b78] text-white font-bold">Registrar Repartidor</Button>
                </form>
              </CardContent>
            </Card>

            <Card className="bg-white border-zinc-200 shadow-sm">
              <CardHeader>
                <CardTitle className="font-serif text-xl text-[#073b78]">Lista de Domiciliarios</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Teléfono</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {repartidores.map(r => (
                      <TableRow key={r.id}>
                        <TableCell className="font-bold">{r.nombre}</TableCell>
                        <TableCell>{r.telefono}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {tabActiva === 'cierre' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <Card className="bg-white border-zinc-200 shadow-sm">
              <CardHeader className="bg-[#073b78] text-white rounded-t-xl">
                <CardTitle className="font-serif text-xl">Arqueo y Cierre Diario de Caja (Cierre Z)</CardTitle>
                <CardDescription className="text-blue-200 text-xs">Resumen financiero consolidado del turno actual.</CardDescription>
              </CardHeader>
              
              <CardContent className="p-6 space-y-6 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-zinc-50 p-3 rounded border border-zinc-200">
                    <p className="text-[10px] text-zinc-400 font-bold uppercase">Pedidos</p>
                    <p className="text-xl font-black text-zinc-900">{pedidosDelDia.length}</p>
                  </div>
                  <div className="bg-zinc-50 p-3 rounded border border-zinc-200">
                    <p className="text-[10px] text-zinc-400 font-bold uppercase">Efectivo</p>
                    <p className="text-base font-black text-green-700">${totalEfectivo.toLocaleString('es-CO')}</p>
                  </div>
                  <div className="bg-zinc-50 p-3 rounded border border-zinc-200">
                    <p className="text-[10px] text-zinc-400 font-bold uppercase">Digital / ePayco</p>
                    <p className="text-base font-black text-blue-700">${totalDigital.toLocaleString('es-CO')}</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded border border-blue-200">
                    <p className="text-[10px] text-blue-800 font-bold uppercase">Total Recaudado</p>
                    <p className="text-lg font-black text-[#073b78]">${totalRecaudado.toLocaleString('es-CO')}</p>
                  </div>
                </div>

                <form onSubmit={handleGenerarCierre} className="space-y-4 border-t pt-4 border-zinc-200">
                  <div>
                    <label className="font-bold text-zinc-700">Nombre del Cajero / Responsable</label>
                    <Input required value={cajeroNombre} onChange={e => setCajeroNombre(e.target.value)} placeholder="Ej: Andrea Gómez" />
                  </div>

                  <div>
                    <label className="font-bold text-zinc-700">Observaciones o Novedades de Turno</label>
                    <textarea 
                      rows={3} 
                      value={observacionesCierre} 
                      onChange={e => setObservacionesCierre(e.target.value)} 
                      className="w-full border border-zinc-300 p-2.5 rounded-lg text-xs outline-none focus:border-[#073b78]"
                      placeholder="Efectivo entregado en sobre, descuadre de cambio, etc..."
                    />
                  </div>

                  <Button type="submit" className="w-full bg-[#073b78] hover:bg-[#052d5e] text-white font-bold py-3 uppercase tracking-wider">
                    Confirmar y Guardar Cierre Z
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

      </div>
    </div>
  );
}