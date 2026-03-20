import { create } from "zustand";

const MAX_DRAFTS = 20;
const STORAGE_KEY = "kazahana-drafts";

export interface DraftImage {
  /** Base64 data URL (compressed thumbnail) */
  dataUrl: string;
  alt: string;
}

export interface PostDraft {
  id: string;
  text: string;
  images: DraftImage[];
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
  ogpUrl: string | null;
  threadgate: "everyone" | "mention" | "follower" | "following" | "nobody";
  disableQuote: boolean;
  createdAt: string;
}

interface DraftState {
  drafts: PostDraft[];
  saveDraft: (draft: Omit<PostDraft, "id" | "createdAt">) => void;
  deleteDraft: (id: string) => void;
  clearAllDrafts: () => void;
}

function loadDrafts(): PostDraft[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistDrafts(drafts: PostDraft[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
}

export const useDraftStore = create<DraftState>((set) => ({
  drafts: loadDrafts(),

  saveDraft: (draft) => {
    set((state) => {
      const newDraft: PostDraft = {
        ...draft,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      // Prepend new draft, cap at MAX_DRAFTS
      const drafts = [newDraft, ...state.drafts].slice(0, MAX_DRAFTS);
      persistDrafts(drafts);
      return { drafts };
    });
  },

  deleteDraft: (id) => {
    set((state) => {
      const drafts = state.drafts.filter((d) => d.id !== id);
      persistDrafts(drafts);
      return { drafts };
    });
  },

  clearAllDrafts: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ drafts: [] });
  },
}));

/** Compress an image File to a small thumbnail data URL for draft storage. */
export async function compressForDraft(file: File): Promise<string> {
  const img = await createImageBitmap(file);
  const maxW = 400;
  const scale = Math.min(1, maxW / img.width);
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);
  img.close();

  const blob = await canvas.convertToBlob({ type: "image/jpeg", quality: 0.5 });
  return new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

/** Convert a data URL back to a File for use in ComposeModal. */
export function dataUrlToFile(dataUrl: string, name = "draft-image.jpg"): File {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] || "image/jpeg";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new File([bytes], name, { type: mime });
}
