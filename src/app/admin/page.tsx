import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const revalidate = 0;

export default async function AdminPage() {
  const { data: productos } = await supabase
    .from('productos')
    .select('*')
    .order('id', { ascending: true });

  return (
    <main className="min-h-screen bg-zinc-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-zinc-900">Panel de Control</h1>
            <p className="text-zinc-500">Gestión de inventario y catálogo</p>
          </div>
          <Link href="/">
            <Button variant="outline">Volver a la tienda</Button>
          </Link>
        </div>

        <Card className="shadow-sm border-zinc-200">
          <CardHeader>
            <CardTitle>Inventario de Productos</CardTitle>
            <CardDescription>Administra el stock y los precios actuales de Los Compadres.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productos?.map((producto) => (
                  <TableRow key={producto.id}>
                    <TableCell className="font-medium text-zinc-900">{producto.nombre}</TableCell>
                    <TableCell>{producto.categoria}</TableCell>
                    <TableCell className="text-right">${producto.precio.toLocaleString('es-CO')}</TableCell>
                    <TableCell className="text-right font-bold">{producto.stock}</TableCell>
                    <TableCell className="text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${producto.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {producto.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="secondary" size="sm">Editar</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}