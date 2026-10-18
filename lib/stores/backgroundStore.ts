import { create } from 'zustand';

interface BackgroundState {
    overrideBackground: string | null;
    setOverrideBackground: (bg: string | null) => void;
}

export const useBackgroundStore = create<BackgroundState>((set) => ({
    overrideBackground: null,
    setOverrideBackground: (bg) => set({ overrideBackground: bg }),
}));
