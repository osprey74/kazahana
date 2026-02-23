import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

interface TargetInfo {
  hasSelection: boolean;
  selectionText: string;
  isInput: boolean;
  inputElement: HTMLInputElement | HTMLTextAreaElement | null;
  linkHref: string | null;
  imageSrc: string | null;
}

interface MenuState {
  isOpen: boolean;
  x: number;
  y: number;
  target: TargetInfo;
}

const INITIAL_TARGET: TargetInfo = {
  hasSelection: false,
  selectionText: "",
  isInput: false,
  inputElement: null,
  linkHref: null,
  imageSrc: null,
};

export function ContextMenu() {
  const { t } = useTranslation();
  const [menu, setMenu] = useState<MenuState>({ isOpen: false, x: 0, y: 0, target: INITIAL_TARGET });
  const menuRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setMenu((prev) => ({ ...prev, isOpen: false })), []);

  // Global contextmenu listener
  useEffect(() => {
    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();

      const el = e.target as HTMLElement;

      // Detect target info
      const selection = window.getSelection();
      const selectionText = selection?.toString() ?? "";

      const isInput =
        el.tagName === "INPUT" ||
        el.tagName === "TEXTAREA" ||
        el.isContentEditable;

      const inputElement =
        isInput && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")
          ? (el as HTMLInputElement | HTMLTextAreaElement)
          : null;

      const linkEl = el.closest("a[href]") as HTMLAnchorElement | null;
      const linkHref = linkEl?.href ?? null;

      const imageSrc = el instanceof HTMLImageElement ? el.src : null;

      setMenu({
        isOpen: true,
        x: e.clientX,
        y: e.clientY,
        target: {
          hasSelection: selectionText.length > 0,
          selectionText,
          isInput,
          inputElement,
          linkHref,
          imageSrc,
        },
      });
    };

    window.addEventListener("contextmenu", onContextMenu);
    return () => window.removeEventListener("contextmenu", onContextMenu);
  }, []);

  // Close on click outside or ESC
  useEffect(() => {
    if (!menu.isOpen) return;

    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        close();
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menu.isOpen, close]);

  // Adjust position to stay within viewport
  useEffect(() => {
    if (!menu.isOpen || !menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    let { x, y } = menu;
    let changed = false;
    if (x + rect.width > window.innerWidth) {
      x = window.innerWidth - rect.width - 4;
      changed = true;
    }
    if (y + rect.height > window.innerHeight) {
      y = window.innerHeight - rect.height - 4;
      changed = true;
    }
    if (changed) setMenu((prev) => ({ ...prev, x, y }));
  }, [menu.isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!menu.isOpen) return null;

  const { target } = menu;

  // Actions
  const handleReload = () => {
    close();
    window.dispatchEvent(new CustomEvent("kazahana:refresh"));
  };

  const handleCopy = () => {
    close();
    if (target.selectionText) {
      navigator.clipboard.writeText(target.selectionText);
    } else {
      document.execCommand("copy");
    }
  };

  const handleSelectAll = () => {
    close();
    if (target.inputElement) {
      target.inputElement.select();
    } else {
      document.execCommand("selectAll");
    }
  };

  const handleCut = () => {
    close();
    document.execCommand("cut");
  };

  const handlePaste = async () => {
    close();
    try {
      const text = await navigator.clipboard.readText();
      document.execCommand("insertText", false, text);
    } catch {
      document.execCommand("paste");
    }
  };

  const handleUndo = () => {
    close();
    document.execCommand("undo");
  };

  const handleCopyLink = () => {
    close();
    if (target.linkHref) {
      navigator.clipboard.writeText(target.linkHref);
    }
  };

  const handleCopyImage = async () => {
    close();
    if (!target.imageSrc) return;
    try {
      const res = await tauriFetch(target.imageSrc);
      const blob = await res.blob();
      // Convert to PNG for clipboard compatibility
      const pngBlob = blob.type === "image/png" ? blob : await convertToPng(blob);
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": pngBlob }),
      ]);
    } catch (e) {
      console.error("Failed to copy image:", e);
    }
  };

  const handleSaveImage = async () => {
    close();
    if (!target.imageSrc) return;
    try {
      const res = await tauriFetch(target.imageSrc);
      const blob = await res.blob();
      const ext = getImageExtension(blob.type);
      const fileName = getImageFilename(target.imageSrc, ext);
      const filePath = await save({
        defaultPath: fileName,
        filters: [{ name: "Image", extensions: [ext] }],
      });
      if (!filePath) return;
      const buffer = new Uint8Array(await blob.arrayBuffer());
      await writeFile(filePath, buffer);
    } catch (e) {
      console.error("Failed to save image:", e);
    }
  };

  // Build menu items
  const items: (MenuItem | "separator")[] = [];

  if (target.linkHref) {
    items.push({ label: t("contextMenu.copyLink"), action: handleCopyLink });
  }

  if (target.imageSrc) {
    items.push({ label: t("contextMenu.copyImage"), action: handleCopyImage });
    items.push({ label: t("contextMenu.saveImage"), action: handleSaveImage });
  }

  if ((target.linkHref || target.imageSrc) && (target.isInput || target.hasSelection)) {
    items.push("separator");
  }

  if (target.isInput) {
    items.push({ label: t("contextMenu.undo"), action: handleUndo });
    items.push("separator");
    items.push({ label: t("contextMenu.cut"), action: handleCut });
    items.push({ label: t("contextMenu.copy"), action: handleCopy });
    items.push({ label: t("contextMenu.paste"), action: handlePaste });
    items.push("separator");
    items.push({ label: t("contextMenu.selectAll"), action: handleSelectAll });
  } else if (target.hasSelection) {
    items.push({ label: t("contextMenu.copy"), action: handleCopy });
    items.push({ label: t("contextMenu.selectAll"), action: handleSelectAll });
  }

  if (items.length > 0) items.push("separator");
  items.push({ label: t("contextMenu.reload"), action: handleReload });

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[160px] py-1 bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-card shadow-lg"
      style={{ left: menu.x, top: menu.y }}
    >
      {items.map((item, i) =>
        item === "separator" ? (
          <div key={i} className="my-1 border-t border-border-light dark:border-border-dark" />
        ) : (
          <button
            key={i}
            onClick={item.action}
            className="w-full text-left px-3 py-1.5 text-sm text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {item.label}
          </button>
        ),
      )}
    </div>
  );
}

interface MenuItem {
  label: string;
  action: () => void;
}

function getImageFilename(url: string, ext: string): string {
  try {
    const pathname = new URL(url).pathname;
    const lastSegment = pathname.split("/").pop() || "";
    // Bluesky CDN URLs: "bafkreixxx@jpeg" → "bafkreixxx"
    const baseName = lastSegment.split("@")[0];
    if (baseName && baseName !== "image") {
      return `${baseName}.${ext}`;
    }
  } catch {
    // fall through
  }
  return `image.${ext}`;
}

function getImageExtension(mimeType: string): string {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/gif") return "gif";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
}

function convertToPng(blob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas not supported")); return; }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((b) => {
        if (b) resolve(b);
        else reject(new Error("Failed to convert to PNG"));
      }, "image/png");
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(blob);
  });
}
