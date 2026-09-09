'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ImageUploader } from '../../components/ImageUploader';
import Link from 'next/link';

interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  precio: number;
  precio_costo: number;
  stock: number;
  activo: boolean;
  imagen_url?: string;
}

export default function AdminPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);

  // Campos del formulario
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('Aguardiente');
  const [precioVenta, setPrecioVenta] = useState('');
  const [precioCosto, setPrecioCosto] = useState('');
  const [stock, setStock] = useState('');
  const [imagenUrl, setImagenUrl] = useState('');

  const cargarProductos = async () => {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .order('id', { ascending: true });

    if (!error) setProductos(data || []);
    setLoading(false);
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  const handleCrearProducto = async (e: React.FormEvent) => {
    e.preventDefault();

    const pVenta = parseFloat(precioVenta) || 0;
    const pCosto = parseFloat(precioCosto) || 0;
    const pStock = parseInt(stock) || 0;

    const { error } = await supabase.from('productos').insert([
      {
        nombre,
        descripcion,
        categoria,
        precio: pVenta,
        precio_costo: pCosto,
        stock: pStock,
        activo: true,
        imagen_url: imagenUrl || null
      }
    ]);

    if (error) {
      alert('Error al guardar el producto: ' + error.message);
    } else {
      setNombre('');
      setDescripcion('');
      setPrecioVenta('');
      setPrecioCosto('');
      setStock('');
      setImagenUrl('');
      setModalAbierto(false);
      cargarProductos();
    }
  };

  const inversionTotal = productos.reduce((acc, p) => acc + ((p.precio_costo || 0) * p.stock), 0);
  const valorVentaTotal = productos.reduce((acc, p) => acc + (p.precio * p.stock), 0);
  const gananciaEstimada = valorVentaTotal - inversionTotal;
  const margenEstimadoForm = (parseFloat(precioVenta) || 0) - (parseFloat(precioCosto) || 0);

  if (loading) return <div className="p-10 font-bold text-center">Cargando inventario...</div>;

  return (
    <main className="min-h-screen bg-zinc-50 p-6 text-zinc-900">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Encabezado */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black">📦 Panel de Inventario</h1>
            <p className="text-zinc-500">Gestión de catálogo, imágenes y márgenes operativos.</p>
          </div>
          
          <div className="flex gap-3">
            <Link href="/admin/pedidos">
              <Button variant="outline" className="font-bold">🛵 Ver Pedidos</Button>
            </Link>

            <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
              <DialogTrigger asChild>
                <Button className="font-bold bg-black text-white hover:bg-zinc-800">
                  + Nuevo Producto
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-white max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl font-black">Agregar Nuevo Licor</DialogTitle>
                  <DialogDescription>
                    Ingresa los detalles, imagen y precios para calcular la utilidad.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleCrearProducto} className="space-y-4 py-2">
                  <div>
                    <label className="text-xs font-bold text-zinc-700">Nombre del producto</label>
                    <Input required placeholder="Ej: Aguardiente Antioqueño 750ml" value={nombre} onChange={e => setNombre(e.target.value)} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-zinc-700">Categoría</label>
                      <select 
                        value={categoria} 
                        onChange={e => setCategoria(e.target.value)}
                        className="w-full border rounded-md p-2 text-sm bg-white border-zinc-200 font-medium"
                      >
                        <option value="Aguardiente">Aguardiente</option>
                        <option value="Ron">Ron</option>
                        <option value="Whisky">Whisky</option>
                        <option value="Cervezas">Cervezas</option>
                        <option value="Tequila">Tequila</option>
                        <option value="Vinos">Vinos</option>
                        <option value="Snacks">Snacks</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-zinc-700">Stock Inicial</label>
                      <Input required type="number" placeholder="Ej: 24" value={stock} onChange={e => setStock(e.target.value)} />
                    </div>
                  </div>

                  {/* Subida de Imagen a Supabase Storage */}
                  <ImageUploader onImageUploaded={(url) => setImagenUrl(url)} />

                  {/* Precios */}
                  <div className="grid grid-cols-2 gap-3 bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                    <div>
                      <label className="text-xs font-bold text-zinc-700">Precio Costo</label>
                      <Input required type="number" placeholder="$ 35.000" value={precioCosto} onChange={e => setPrecioCosto(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-zinc-700">Precio Venta</label>
                      <Input required type="number" placeholder="$ 50.000" value={precioVenta} onChange={e => setPrecioVenta(e.target.value)} />
                    </div>
                    
                    <div className="col-span-2 flex justify-between items-center text-xs pt-1 font-bold">
                      <span className="text-zinc-500">Ganancia/Ud:</span>
                      <span className={margenEstimadoForm >= 0 ? 'text-green-600' : 'text-red-500'}>
                        ${margenEstimadoForm.toLocaleString('es-CO')}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-700">Descripción</label>
                    <Input placeholder="Tapa roja/azul, notas de cata..." value={descripcion} onChange={e => setDescripcion(e.target.value)} />
                  </div>

                  <DialogFooter className="pt-2">
                    <Button type="submit" className="w-full font-bold bg-green-600 hover:bg-green-700 text-white">
                      Guardar en Catálogo
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

          </div>
        </div>

        {/* Tarjetas Financieras */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white border-zinc-200">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-bold text-zinc-500">Inversión Actual</CardDescription>
              <CardTitle className="text-2xl font-black text-zinc-900">${inversionTotal.toLocaleString('es-CO')}</CardTitle>
            </CardHeader>
          </Card>

          <Card className="bg-white border-zinc-200">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-bold text-zinc-500">Venta Proyectada</CardDescription>
              <CardTitle className="text-2xl font-black text-blue-600">${valorVentaTotal.toLocaleString('es-CO')}</CardTitle>
            </CardHeader>
          </Card>

          <Card className="bg-white border-zinc-200">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-bold text-zinc-500">Utilidad Bruta Estimada</CardDescription>
              <CardTitle className="text-2xl font-black text-green-600">${gananciaEstimada.toLocaleString('es-CO')}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Tabla */}
        <Card className="shadow-sm border-zinc-200 bg-white">
          <CardHeader>
            <CardTitle>Listado y Márgenes Operativos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Imagen</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-right">P. Costo</TableHead>
                  <TableHead className="text-right">P. Venta</TableHead>
                  <TableHead className="text-right">Margen / Ud.</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productos.map((p) => {
                  const margen = p.precio - (p.precio_costo || 0);
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center overflow-hidden border">
                          {p.imagen_url ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={p.imagen_url} alt={p.nombre} className="w-full h-full object-contain p-1" />
                          ) : (
                            <span className="text-xs">🍾</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-zinc-900">{p.nombre}</TableCell>
                      <TableCell>{p.categoria}</TableCell>
                      <TableCell className="text-right text-zinc-500">${(p.precio_costo || 0).toLocaleString('es-CO')}</TableCell>
                      <TableCell className="text-right font-bold">${p.precio.toLocaleString('es-CO')}</TableCell>
                      <TableCell className="text-right font-bold text-green-600">
                        +${margen.toLocaleString('es-CO')}
                      </TableCell>
                      <TableCell className="text-right font-black">{p.stock}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      </div>
    </main>
  );
}