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
  addItem: (product: { id: string; nombre: string; precio: number; categoria: string }) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  
  addItem: (product) => {
    set((state) => {
      const existingIndex = state.items.findIndex((item) => item.id === product.id);
      
      if (existingIndex > -1) {
        // Si el producto ya está en el carrito, aumentamos la cantidad
        const newItems = [...state.items];
        newItems[existingIndex].cantidad += 1;
        return { items: newItems };
      }
      
      // Si es nuevo, lo agregamos con cantidad 1
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

  clearCart: () => set({ items: [] }),

  getTotalItems: () => {
    return get().items.reduce((total, item) => total + item.cantidad, 0);
  },

  getTotalPrice: () => {
    return get().items.reduce((total, item) => total + (item.precio * item.cantidad), 0);
  },
}));