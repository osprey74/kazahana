import { create } from "zustand";

interface CreateGroupState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export const useCreateGroupStore = create<CreateGroupState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
