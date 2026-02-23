import { create } from "zustand";

interface ListManagementState {
  isOpen: boolean;
  targetDid: string;
  targetName: string;
  open: (did: string, name: string) => void;
  close: () => void;
}

export const useListManagementStore = create<ListManagementState>((set) => ({
  isOpen: false,
  targetDid: "",
  targetName: "",
  open: (did, name) => set({ isOpen: true, targetDid: did, targetName: name }),
  close: () => set({ isOpen: false, targetDid: "", targetName: "" }),
}));
