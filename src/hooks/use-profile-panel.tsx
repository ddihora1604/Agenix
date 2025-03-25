import { create } from 'zustand';

interface ProfilePanelState {
  isOpen: boolean;
  openProfilePanel: () => void;
  closeProfilePanel: () => void;
  toggleProfilePanel: () => void;
}

export const useProfilePanel = create<ProfilePanelState>((set) => ({
  isOpen: false,
  openProfilePanel: () => set({ isOpen: true }),
  closeProfilePanel: () => set({ isOpen: false }),
  toggleProfilePanel: () => set((state) => ({ isOpen: !state.isOpen })),
})); 