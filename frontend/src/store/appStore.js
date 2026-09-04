import { create } from 'zustand';

const useAppStore = create((set) => ({
    mode: 'light',
    toggleMode: () => set((state) => ({ mode: state.mode === 'light' ? 'dark' : 'light' })),
    sidebarOpen: true,
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    setSidebarOpen: (isOpen) => set({ sidebarOpen: isOpen }),
}));

export default useAppStore;
