import { useEffect, useCallback, useRef, useState } from "react";
import { useLightboxStore } from "../../stores/lightboxStore";
import { Icon } from "./Icon";

export function ImageLightbox() {
  const { isOpen, images, currentIndex, close, next, prev, goTo } =
    useLightboxStore();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      switch (e.key) {
        case "Escape":
          close();
          break;
        case "ArrowLeft":
          prev();
          break;
        case "ArrowRight":
          next();
          break;
      }
    },
    [isOpen, close, prev, next],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Prevent body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Swipe gesture state
  const [dragX, setDragX] = useState(0);
  const dragRef = useRef({ startX: 0, startY: 0, dragging: false, swiped: false });

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    dragRef.current = { startX: e.clientX, startY: e.clientY, dragging: true, swiped: false };
    setDragX(0);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current.dragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    // Only track horizontal drag if it's more horizontal than vertical
    if (!dragRef.current.swiped && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 5) {
      dragRef.current.swiped = true;
    }
    if (dragRef.current.swiped) {
      setDragX(dx);
    }
  }, []);

  const SWIPE_THRESHOLD = 50;

  const handlePointerUp = useCallback(() => {
    if (!dragRef.current.dragging) return;
    dragRef.current.dragging = false;
    if (dragRef.current.swiped) {
      if (dragX > SWIPE_THRESHOLD) {
        prev();
      } else if (dragX < -SWIPE_THRESHOLD) {
        next();
      }
    }
    setDragX(0);
  }, [dragX, prev, next]);

  // Reset drag state on image change
  useEffect(() => {
    setDragX(0);
    dragRef.current = { startX: 0, startY: 0, dragging: false, swiped: false };
  }, [currentIndex]);

  if (!isOpen || images.length === 0) return null;

  const current = images[currentIndex];
  const hasMultiple = images.length > 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={close}
    >
      {/* Close button */}
      <button
        onClick={close}
        className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-black/50 text-white/80 hover:text-white hover:bg-black/70 transition-colors"
      >
        <Icon name="close" size={22} />
      </button>

      {/* Previous button */}
      {hasMultiple && currentIndex > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            prev();
          }}
          className="absolute left-3 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-black/50 text-white/80 hover:text-white hover:bg-black/70 transition-colors"
        >
          <Icon name="chevron_left" size={24} />
        </button>
      )}

      {/* Image + Alt text */}
      <div
        className="flex flex-col items-center max-w-[90vw] max-h-[90vh] touch-none"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={hasMultiple ? handlePointerDown : undefined}
        onPointerMove={hasMultiple ? handlePointerMove : undefined}
        onPointerUp={hasMultiple ? handlePointerUp : undefined}
        onPointerCancel={hasMultiple ? handlePointerUp : undefined}
        style={hasMultiple && dragX !== 0 ? { transform: `translateX(${dragX}px)`, transition: 'none' } : { transition: 'transform 0.2s ease-out' }}
      >
        <img
          src={current.fullsize}
          alt={current.alt}
          className="max-w-[90vw] max-h-[80vh] object-contain select-none pointer-events-none"
          draggable={false}
        />
        {current.alt && (
          <p className="mt-2 px-3 py-1.5 max-w-[80vw] text-white/80 text-xs text-left leading-relaxed self-start">
            {current.alt}
          </p>
        )}
      </div>

      {/* Next button */}
      {hasMultiple && currentIndex < images.length - 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            next();
          }}
          className="absolute right-3 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-black/50 text-white/80 hover:text-white hover:bg-black/70 transition-colors"
        >
          <Icon name="chevron_right" size={24} />
        </button>
      )}

      {/* Indicator dots */}
      {hasMultiple && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                goTo(i);
              }}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === currentIndex
                  ? "bg-white"
                  : "bg-white/40 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
