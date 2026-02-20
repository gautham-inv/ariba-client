import { create } from 'zustand';

interface SupplierUIState {
    isCreating: boolean;
    toggleCreating: () => void;
    setCreating: (value: boolean) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
}

export const useSupplierStore = create<SupplierUIState>((set) => ({
    isCreating: false,
    toggleCreating: () => set((state) => ({ isCreating: !state.isCreating })),
    setCreating: (value) => set({ isCreating: value }),
    searchQuery: '',
    setSearchQuery: (query) => set({ searchQuery: query }),
}));
