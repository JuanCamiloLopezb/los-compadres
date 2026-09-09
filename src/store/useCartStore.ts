import { create } from 'zustand';

export interface CartItem {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
  categoria: string;
}

interface CartState {
  items: CartItem[];
  descuento: number; // Porcentaje de descuento (ej: 0.10 para 10%)
  codigoCupon: string;
  costoEnvio: number;
  direccionEnvio: string;
  
  addItem: (product: { id: string; nombre: string; precio: number; categoria: string }) => void;
  removeItem: (id: string) => void;
  deleteItem: (id: string) => void;
  clearCart: () => void;
  
  aplicarCupon: (codigo: string) => boolean;
  calcularEnvio: (direccion: string) => void;
  
  getSubtotal: () => number;
  getMontoDescuento: () => number;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  descuento: 0,
  codigoCupon: '',
  costoEnvio: 0,
  direccionEnvio: '',

  addItem: (product) => {
    set((state) => {
      const existingIndex = state.items.findIndex((item) => item.id === product.id);
      if (existingIndex > -1) {
        const newItems = [...state.items];
        newItems[existingIndex].cantidad += 1;
        return { items: newItems };
      }
      return { items: [...state.items, { ...product, cantidad: 1 }] };
    });
  },

  removeItem: (id) => {
    set((state) => {
      const existingIndex = state.items.findIndex((item) => item.id === id);
      if (existingIndex > -1) {
        const newItems = [...state.items];
        if (newItems[existingIndex].cantidad > 1) {
          newItems[existingIndex].cantidad -= 1;
        } else {
          newItems.splice(existingIndex, 1);
        }
        return { items: newItems };
      }
      return state;
    });
  },

  deleteItem: (id) => {
    set((state) => ({ items: state.items.filter((item) => item.id !== id) }));
  },

  clearCart: () => set({ items: [], descuento: 0, codigoCupon: '', costoEnvio: 0 }),

  aplicarCupon: (codigo) => {
    const cuponLimpio = codigo.trim().toUpperCase();
    
    // Lista de cupones válidos
    if (cuponLimpio === 'COMPADRES10') {
      set({ descuento: 0.10, codigoCupon: cuponLimpio }); // 10% de descuento
      return true;
    } else if (cuponLimpio === 'BIENVENIDO15') {
      set({ descuento: 0.15, codigoCupon: cuponLimpio }); // 15% de descuento
      return true;
    }
    return false;
  },

  calcularEnvio: (direccion) => {
    set({ direccionEnvio: direccion });
    if (!direccion || direccion.length < 5) {
      set({ costoEnvio: 0 });
      return;
    }

    // Algoritmo simulado de cálculo de tarifa según zona/dirección
    const dirLower = direccion.toLowerCase();
    if (dirLower.includes('norte') || dirLower.includes('chico') || dirLower.includes('usaquen')) {
      set({ costoEnvio: 5000 });
    } else if (dirLower.includes('sur') || dirLower.includes('bosa') || dirLower.includes('usme')) {
      set({ costoEnvio: 9000 });
    } else {
      set({ costoEnvio: 7000 }); // Tarifa estándar
    }
  },

  getSubtotal: () => get().items.reduce((total, item) => total + item.precio * item.cantidad, 0),
  
  getMontoDescuento: () => get().getSubtotal() * get().descuento,
  
  getTotalPrice: () => {
    const subtotal = get().getSubtotal();
    const descuento = get().getMontoDescuento();
    const envio = get().costoEnvio;
    return subtotal - descuento + envio;
  },

  getTotalItems: () => get().items.reduce((total, item) => total + item.cantidad, 0),
}));