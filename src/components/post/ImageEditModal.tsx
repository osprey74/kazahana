import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "../common/Icon";

interface ImageEditModalProps {
  file: File;
  onApply: (editedFile: File) => void;
  onClose: () => void;
}

type CropMode = "free" | "original" | "square";

interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const PREVIEW_MAX = 320;

/** Rotate an image by the given angle (90° increments) and return a new File. */
async function rotateImage(file: File, angle: number): Promise<File> {
  const normalized = ((angle % 360) + 360) % 360;
  if (normalized === 0) return file;

  const img = await createImageBitmap(file);
  const swap = normalized === 90 || normalized === 270;
  const w = swap ? img.height : img.width;
  const h = swap ? img.width : img.height;

  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext("2d")!;
  ctx.translate(w / 2, h / 2);
  ctx.rotate((normalized * Math.PI) / 180);
  ctx.drawImage(img, -img.width / 2, -img.height / 2);
  img.close();

  const blob = await canvas.convertToBlob({ type: "image/jpeg", quality: 0.92 });
  return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
}

/** Crop an image to the given rectangle (pixel coordinates on original). */
async function cropImage(file: File, crop: CropRect): Promise<File> {
  const img = await createImageBitmap(file);
  const canvas = new OffscreenCanvas(Math.round(crop.w), Math.round(crop.h));
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, crop.w, crop.h);
  img.close();

  const blob = await canvas.convertToBlob({ type: "image/jpeg", quality: 0.92 });
  return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
}

/** Compute display scale so the image fits within PREVIEW_MAX. */
function computeScale(imgW: number, imgH: number): number {
  return Math.min(1, PREVIEW_MAX / imgW, PREVIEW_MAX / imgH);
}

/** Clamp crop rect to stay within image bounds and respect aspect ratio. */
function clampCrop(crop: CropRect, imgW: number, imgH: number, mode: CropMode, origAspect: number): CropRect {
  let { x, y, w, h } = crop;

  // Enforce minimum size (20px on original)
  w = Math.max(20, w);
  h = Math.max(20, h);

  // Enforce aspect ratio
  if (mode === "square") {
    const side = Math.min(w, h, imgW, imgH);
    w = side;
    h = side;
  } else if (mode === "original") {
    // Fit w/h to original aspect within bounds
    if (w / h > origAspect) {
      w = h * origAspect;
    } else {
      h = w / origAspect;
    }
  }

  // Clamp position
  if (w > imgW) w = imgW;
  if (h > imgH) h = imgH;
  if (x < 0) x = 0;
  if (y < 0) y = 0;
  if (x + w > imgW) x = imgW - w;
  if (y + h > imgH) y = imgH - h;

  return { x, y, w, h };
}

export function ImageEditModal({ file, onApply, onClose }: ImageEditModalProps) {
  const { t } = useTranslation();
  const [rotation, setRotation] = useState(0);
  const [isApplying, setIsApplying] = useState(false);
  const [cropMode, setCropMode] = useState<CropMode | null>(null);
  const [crop, setCrop] = useState<CropRect>({ x: 0, y: 0, w: 0, h: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Drag state refs (avoid re-renders during drag)
  const dragRef = useRef<{
    active: boolean;
    type: "move" | "nw" | "ne" | "sw" | "se";
    startX: number;
    startY: number;
    startCrop: CropRect;
  } | null>(null);

  // Derived: rotated image dimensions
  const getRotatedDims = useCallback(() => {
    const img = imgRef.current;
    if (!img) return { w: 0, h: 0 };
    const normalized = ((rotation % 360) + 360) % 360;
    const swap = normalized === 90 || normalized === 270;
    return {
      w: swap ? img.naturalHeight : img.naturalWidth,
      h: swap ? img.naturalWidth : img.naturalHeight,
    };
  }, [rotation]);

  // Load original image once
  useEffect(() => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setImageLoaded(true);
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Initialize crop when mode changes
  useEffect(() => {
    if (!cropMode) return;
    const { w: imgW, h: imgH } = getRotatedDims();
    if (imgW === 0) return;

    const origAspect = imgW / imgH;
    let cw: number, ch: number;

    if (cropMode === "square") {
      const side = Math.min(imgW, imgH) * 0.8;
      cw = side;
      ch = side;
    } else if (cropMode === "original") {
      cw = imgW * 0.8;
      ch = imgH * 0.8;
    } else {
      cw = imgW * 0.8;
      ch = imgH * 0.8;
    }

    const newCrop = clampCrop(
      { x: (imgW - cw) / 2, y: (imgH - ch) / 2, w: cw, h: ch },
      imgW, imgH, cropMode, origAspect,
    );
    setCrop(newCrop);
  }, [cropMode, getRotatedDims]);

  // Draw main canvas (rotated image)
  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const { w, h } = getRotatedDims();
    if (w === 0) return;

    const scale = computeScale(w, h);
    const cw = Math.round(w * scale);
    const ch = Math.round(h * scale);

    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, cw, ch);

    const normalized = ((rotation % 360) + 360) % 360;
    ctx.translate(cw / 2, ch / 2);
    ctx.rotate((normalized * Math.PI) / 180);
    ctx.drawImage(
      img,
      (-img.naturalWidth * scale) / 2,
      (-img.naturalHeight * scale) / 2,
      img.naturalWidth * scale,
      img.naturalHeight * scale,
    );

    // Sync overlay size
    const overlay = overlayRef.current;
    if (overlay) {
      overlay.width = cw;
      overlay.height = ch;
    }
  }, [rotation, imageLoaded, getRotatedDims]);

  // Draw crop overlay
  const drawOverlay = useCallback((cropRect: CropRect) => {
    const overlay = overlayRef.current;
    if (!overlay || !cropMode) return;

    const { w: imgW, h: imgH } = getRotatedDims();
    if (imgW === 0) return;
    const scale = computeScale(imgW, imgH);

    const ctx = overlay.getContext("2d")!;
    const ow = overlay.width;
    const oh = overlay.height;
    ctx.clearRect(0, 0, ow, oh);

    // Dim outside crop area
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, ow, oh);

    // Clear crop area
    const sx = cropRect.x * scale;
    const sy = cropRect.y * scale;
    const sw = cropRect.w * scale;
    const sh = cropRect.h * scale;
    ctx.clearRect(sx, sy, sw, sh);

    // Border
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.strokeRect(sx, sy, sw, sh);

    // Corner handles
    const handleSize = 10;
    ctx.fillStyle = "#ffffff";
    const corners = [
      [sx, sy], // nw
      [sx + sw, sy], // ne
      [sx, sy + sh], // sw
      [sx + sw, sy + sh], // se
    ];
    for (const [cx, cy] of corners) {
      ctx.fillRect(cx - handleSize / 2, cy - handleSize / 2, handleSize, handleSize);
    }

    // Rule of thirds grid lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 1;
    for (let i = 1; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(sx + (sw * i) / 3, sy);
      ctx.lineTo(sx + (sw * i) / 3, sy + sh);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(sx, sy + (sh * i) / 3);
      ctx.lineTo(sx + sw, sy + (sh * i) / 3);
      ctx.stroke();
    }
  }, [cropMode, getRotatedDims]);

  useEffect(() => {
    if (cropMode) drawOverlay(crop);
  }, [crop, cropMode, drawOverlay]);

  // Clear overlay when crop mode is turned off
  useEffect(() => {
    if (!cropMode) {
      const overlay = overlayRef.current;
      if (overlay) {
        const ctx = overlay.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, overlay.width, overlay.height);
      }
    }
  }, [cropMode]);

  // Mouse/touch handlers for crop drag
  const getEventPos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return { mx: 0, my: 0 };
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return { mx: clientX - rect.left, my: clientY - rect.top };
  }, []);

  const handlePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!cropMode) return;
    e.preventDefault();

    const { mx, my } = getEventPos(e);
    const { w: imgW, h: imgH } = getRotatedDims();
    const scale = computeScale(imgW, imgH);

    const sx = crop.x * scale;
    const sy = crop.y * scale;
    const sw = crop.w * scale;
    const sh = crop.h * scale;

    const threshold = 16;

    // Check corners first
    const corners: Array<{ type: "nw" | "ne" | "sw" | "se"; cx: number; cy: number }> = [
      { type: "nw", cx: sx, cy: sy },
      { type: "ne", cx: sx + sw, cy: sy },
      { type: "sw", cx: sx, cy: sy + sh },
      { type: "se", cx: sx + sw, cy: sy + sh },
    ];

    for (const corner of corners) {
      if (Math.abs(mx - corner.cx) < threshold && Math.abs(my - corner.cy) < threshold) {
        dragRef.current = { active: true, type: corner.type, startX: mx, startY: my, startCrop: { ...crop } };
        return;
      }
    }

    // Check if inside crop area → move
    if (mx >= sx && mx <= sx + sw && my >= sy && my <= sy + sh) {
      dragRef.current = { active: true, type: "move", startX: mx, startY: my, startCrop: { ...crop } };
    }
  }, [cropMode, crop, getEventPos, getRotatedDims]);

  const handlePointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const drag = dragRef.current;
    if (!drag?.active || !cropMode) return;
    e.preventDefault();

    const { mx, my } = getEventPos(e);
    const { w: imgW, h: imgH } = getRotatedDims();
    const scale = computeScale(imgW, imgH);
    const origAspect = imgW / imgH;

    const dx = (mx - drag.startX) / scale;
    const dy = (my - drag.startY) / scale;
    const sc = drag.startCrop;

    let newCrop: CropRect;

    if (drag.type === "move") {
      newCrop = { x: sc.x + dx, y: sc.y + dy, w: sc.w, h: sc.h };
    } else {
      // Resize from corner
      let nx = sc.x, ny = sc.y, nw = sc.w, nh = sc.h;

      if (drag.type === "nw") {
        nx = sc.x + dx;
        ny = sc.y + dy;
        nw = sc.w - dx;
        nh = sc.h - dy;
      } else if (drag.type === "ne") {
        ny = sc.y + dy;
        nw = sc.w + dx;
        nh = sc.h - dy;
      } else if (drag.type === "sw") {
        nx = sc.x + dx;
        nw = sc.w - dx;
        nh = sc.h + dy;
      } else {
        // se
        nw = sc.w + dx;
        nh = sc.h + dy;
      }

      // Enforce aspect for constrained modes
      if (cropMode === "square") {
        const side = Math.max(20, Math.min(nw, nh));
        if (drag.type === "nw") {
          nx = sc.x + sc.w - side;
          ny = sc.y + sc.h - side;
        } else if (drag.type === "ne") {
          ny = sc.y + sc.h - side;
        } else if (drag.type === "sw") {
          nx = sc.x + sc.w - side;
        }
        nw = side;
        nh = side;
      } else if (cropMode === "original") {
        if (nw / nh > origAspect) {
          nw = nh * origAspect;
        } else {
          nh = nw / origAspect;
        }
        if (drag.type === "nw") {
          nx = sc.x + sc.w - nw;
          ny = sc.y + sc.h - nh;
        } else if (drag.type === "ne") {
          ny = sc.y + sc.h - nh;
        } else if (drag.type === "sw") {
          nx = sc.x + sc.w - nw;
        }
      }

      newCrop = { x: nx, y: ny, w: nw, h: nh };
    }

    const clamped = clampCrop(newCrop, imgW, imgH, cropMode, origAspect);
    setCrop(clamped);
    drawOverlay(clamped);
  }, [cropMode, getEventPos, getRotatedDims, drawOverlay]);

  const handlePointerUp = useCallback(() => {
    if (dragRef.current) dragRef.current.active = false;
  }, []);

  // Cursor style based on position
  const getCursorStyle = useCallback((e: React.MouseEvent): string => {
    if (!cropMode || !overlayRef.current) return "default";
    const rect = overlayRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const { w: imgW, h: imgH } = getRotatedDims();
    const scale = computeScale(imgW, imgH);
    const sx = crop.x * scale;
    const sy = crop.y * scale;
    const sw = crop.w * scale;
    const sh = crop.h * scale;
    const threshold = 16;

    // Check corners
    if (Math.abs(mx - sx) < threshold && Math.abs(my - sy) < threshold) return "nw-resize";
    if (Math.abs(mx - (sx + sw)) < threshold && Math.abs(my - sy) < threshold) return "ne-resize";
    if (Math.abs(mx - sx) < threshold && Math.abs(my - (sy + sh)) < threshold) return "sw-resize";
    if (Math.abs(mx - (sx + sw)) < threshold && Math.abs(my - (sy + sh)) < threshold) return "se-resize";

    if (mx >= sx && mx <= sx + sw && my >= sy && my <= sy + sh) return "move";
    return "default";
  }, [cropMode, crop, getRotatedDims]);

  const [cursorStyle, setCursorStyle] = useState("default");

  const handleMouseMoveForCursor = useCallback((e: React.MouseEvent) => {
    if (!dragRef.current?.active) {
      setCursorStyle(getCursorStyle(e));
    }
  }, [getCursorStyle]);

  const handleRotateLeft = useCallback(() => {
    setCropMode(null);
    setRotation((r) => r - 90);
  }, []);

  const handleRotateRight = useCallback(() => {
    setCropMode(null);
    setRotation((r) => r + 90);
  }, []);

  const handleApply = useCallback(async () => {
    setIsApplying(true);
    try {
      let result = file;
      const normalized = ((rotation % 360) + 360) % 360;
      if (normalized !== 0) {
        result = await rotateImage(result, rotation);
      }
      if (cropMode) {
        result = await cropImage(result, {
          x: Math.round(crop.x),
          y: Math.round(crop.y),
          w: Math.round(crop.w),
          h: Math.round(crop.h),
        });
      }
      // If nothing changed, just close
      if (normalized === 0 && !cropMode) {
        onClose();
        return;
      }
      onApply(result);
    } finally {
      setIsApplying(false);
    }
  }, [file, rotation, cropMode, crop, onApply, onClose]);

  // Escape to close
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isApplying) onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, isApplying]);

  const toggleCropMode = useCallback((mode: CropMode) => {
    setCropMode((prev) => (prev === mode ? null : mode));
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
      <div className="bg-white dark:bg-bg-dark rounded-card w-full max-w-sm mx-4 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-light dark:border-border-dark">
          <button
            onClick={onClose}
            disabled={isApplying}
            className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50"
          >
            {t("compose.cancel")}
          </button>
          <span className="text-sm font-medium text-text-light dark:text-text-dark">
            {t("image.editImage")}
          </span>
          <button
            onClick={handleApply}
            disabled={isApplying}
            className="px-3 py-1 bg-primary text-white text-sm font-medium rounded-btn hover:bg-blue-600 disabled:opacity-50"
          >
            {isApplying ? "..." : t("image.apply")}
          </button>
        </div>

        {/* Canvas preview with overlay */}
        <div
          ref={containerRef}
          className="flex items-center justify-center p-4 min-h-[200px] bg-gray-100 dark:bg-gray-900"
        >
          <div className="relative inline-block">
            <canvas ref={canvasRef} className="block rounded" />
            <canvas
              ref={overlayRef}
              className="absolute top-0 left-0 rounded"
              style={{ cursor: cursorStyle }}
              onMouseDown={handlePointerDown}
              onMouseMove={(e) => {
                handlePointerMove(e);
                handleMouseMoveForCursor(e);
              }}
              onMouseUp={handlePointerUp}
              onMouseLeave={handlePointerUp}
              onTouchStart={handlePointerDown}
              onTouchMove={handlePointerMove}
              onTouchEnd={handlePointerUp}
            />
          </div>
        </div>

        {/* Crop mode selector */}
        <div className="flex items-center justify-center gap-1 px-4 py-2 border-t border-border-light dark:border-border-dark">
          <button
            onClick={() => toggleCropMode("free")}
            disabled={isApplying}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-btn transition-colors disabled:opacity-50 ${
              cropMode === "free"
                ? "bg-primary text-white"
                : "text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <Icon name="crop" size={16} />
            <span>{t("image.cropFree")}</span>
          </button>
          <button
            onClick={() => toggleCropMode("original")}
            disabled={isApplying}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-btn transition-colors disabled:opacity-50 ${
              cropMode === "original"
                ? "bg-primary text-white"
                : "text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <Icon name="crop_landscape" size={16} />
            <span>{t("image.cropOriginal")}</span>
          </button>
          <button
            onClick={() => toggleCropMode("square")}
            disabled={isApplying}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-btn transition-colors disabled:opacity-50 ${
              cropMode === "square"
                ? "bg-primary text-white"
                : "text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <Icon name="crop_square" size={16} />
            <span>{t("image.cropSquare")}</span>
          </button>
        </div>

        {/* Rotation controls */}
        <div className="flex items-center justify-center gap-6 px-4 py-2 border-t border-border-light dark:border-border-dark">
          <button
            onClick={handleRotateLeft}
            disabled={isApplying}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800 rounded-btn transition-colors disabled:opacity-50"
            title={t("image.rotateLeft")}
          >
            <Icon name="rotate_left" size={20} />
            <span className="text-xs">{t("image.rotateLeft")}</span>
          </button>
          <span className="text-xs text-gray-400 min-w-[3rem] text-center">
            {((rotation % 360) + 360) % 360}°
          </span>
          <button
            onClick={handleRotateRight}
            disabled={isApplying}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800 rounded-btn transition-colors disabled:opacity-50"
            title={t("image.rotateRight")}
          >
            <Icon name="rotate_right" size={20} />
            <span className="text-xs">{t("image.rotateRight")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
