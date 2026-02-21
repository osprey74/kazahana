import { create } from "zustand";

interface ComposeState {
  isOpen: boolean;
  replyTo: {
    uri: string;
    cid: string;
    author: { handle: string; displayName?: string; avatar?: string };
    text: string;
  } | null;

  open: (replyTo?: ComposeState["replyTo"]) => void;
  close: () => void;
}

export const useComposeStore = create<ComposeState>((set) => ({
  isOpen: false,
  replyTo: null,

  open: (replyTo = null) => set({ isOpen: true, replyTo }),
  close: () => set({ isOpen: false, replyTo: null }),
}));
