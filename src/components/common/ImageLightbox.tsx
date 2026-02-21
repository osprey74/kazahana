import { useEffect, useCallback } from "react";
import { useLightboxStore } from "../../stores/lightboxStore";

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
        className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-black/50 text-white/80 hover:text-white hover:bg-black/70 transition-colors text-xl leading-none"
      >
        ×
      </button>

      {/* Previous button */}
      {hasMultiple && currentIndex > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            prev();
          }}
          className="absolute left-3 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-black/50 text-white/80 hover:text-white hover:bg-black/70 transition-colors text-lg leading-none"
        >
          ‹
        </button>
      )}

      {/* Image + Alt text */}
      <div
        className="flex flex-col items-center max-w-[90vw] max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={current.fullsize}
          alt={current.alt}
          className="max-w-[90vw] max-h-[80vh] object-contain select-none"
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
          className="absolute right-3 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-black/50 text-white/80 hover:text-white hover:bg-black/70 transition-colors text-lg leading-none"
        >
          ›
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
