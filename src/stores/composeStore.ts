import { create } from "zustand";

interface ComposeState {
  isOpen: boolean;
  replyTo: {
    uri: string;
    cid: string;
    root?: { uri: string; cid: string };
    author: { handle: string; displayName?: string; avatar?: string };
    text: string;
  } | null;
  quoteTo: {
    uri: string;
    cid: string;
    author: { handle: string; displayName?: string; avatar?: string };
    text: string;
  } | null;

  open: (opts?: { replyTo?: ComposeState["replyTo"]; quoteTo?: ComposeState["quoteTo"] }) => void;
  close: () => void;
}

export const useComposeStore = create<ComposeState>((set) => ({
  isOpen: false,
  replyTo: null,
  quoteTo: null,

  open: (opts) => set({ isOpen: true, replyTo: opts?.replyTo ?? null, quoteTo: opts?.quoteTo ?? null }),
  close: () => set({ isOpen: false, replyTo: null, quoteTo: null }),
}));
