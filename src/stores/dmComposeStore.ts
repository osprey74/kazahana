import { create } from "zustand";

interface DMComposeState {
  isOpen: boolean;
  recipientDid: string | null;
  open: (recipientDid?: string) => void;
  close: () => void;
}

export const useDMComposeStore = create<DMComposeState>((set) => ({
  isOpen: false,
  recipientDid: null,
  open: (recipientDid) => set({ isOpen: true, recipientDid: recipientDid ?? null }),
  close: () => set({ isOpen: false, recipientDid: null }),
}));
