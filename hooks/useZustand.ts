import type { CartItem } from "@/db/models/product";
import type { User } from "@/db/models/user";
import { create } from "zustand";
import { persist } from 'zustand/middleware'

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isBanned: boolean;
    isInitialized: boolean;
    setUser: (user: User | null) => void;
    setInitialized: (status: boolean) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isBanned: false,
    isInitialized: false,
    setUser: (user) => set({
        user,
        isAuthenticated: !!user,
        isInitialized: true
    }),
    setInitialized: (status) => set({ isInitialized: status }),
    logout: () => set({ user: null, isAuthenticated: false, isBanned: false }),
}));


interface CartStore {
    items: CartItem[]
    addItem: (item: CartItem) => void
    removeItem: (variantId: string) => void
    updateQuantity: (variantId: string, quantity: number) => void
    clearCart: () => void
    totalItems: number
}

export const useCartStore = create<CartStore>()(
    persist(
        (set) => ({
            items: [],
            totalItems: 0,
            addItem: (newItem) => set((state) => {
                const existingItem = state.items.find(i => i.variantId === newItem.variantId)
                if (existingItem) {
                    return {
                        items: state.items.map(i => i.variantId === newItem.variantId
                            ? { ...i, quantity: i.quantity + 1 } : i),
                        totalItems: state.totalItems + 1
                    }
                }
                return {
                    items: [...state.items, newItem],
                    totalItems: state.totalItems + 1
                }
            }),
            removeItem: (variantId) => set((state) => ({
                items: state.items.filter(i => i.variantId !== variantId),
                totalItems: state.totalItems - (state.items.find(i => i.variantId === variantId)?.quantity || 0)
            })),
            updateQuantity: (variantId, quantity) => set((state) => ({
                items: state.items.map(i => i.variantId === variantId ? { ...i, quantity } : i),
                totalItems: state.items.reduce((acc, i) => i.variantId === variantId ? acc + quantity : acc + i.quantity, 0)
            })),
            clearCart: () => set({ items: [], totalItems: 0 }),
        }),
        { name: 'lumina-cart-storage' }
    )
)