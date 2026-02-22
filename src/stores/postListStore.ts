import { create } from "zustand";

export type PostListType = "likes" | "reposts" | "quotes";

interface PostListState {
  isOpen: boolean;
  type: PostListType | null;
  uri: string;

  open: (type: PostListType, uri: string) => void;
  close: () => void;
}

export const usePostListStore = create<PostListState>((set) => ({
  isOpen: false,
  type: null,
  uri: "",

  open: (type, uri) => set({ isOpen: true, type, uri }),
  close: () => set({ isOpen: false, type: null, uri: "" }),
}));
