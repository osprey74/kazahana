import type { ViewImage } from "@atproto/api/dist/client/types/app/bsky/embed/images";
import { useLightboxStore } from "../../stores/lightboxStore";

interface ImageGridProps {
  images: ViewImage[];
}

export function ImageGrid({ images }: ImageGridProps) {
  const openLightbox = useLightboxStore((s) => s.open);
  const count = images.length;

  if (count === 0) return null;

  const gridClass =
    count === 1
      ? "grid-cols-1"
      : count === 2
        ? "grid-cols-2"
        : count === 3
          ? "grid-cols-2"
          : "grid-cols-2";

  const handleClick = (index: number) => {
    openLightbox(
      images.map((img) => ({
        fullsize: img.fullsize,
        thumb: img.thumb,
        alt: img.alt || "",
      })),
      index,
    );
  };

  const alts = images
    .map((img, i) => ({ index: i, alt: img.alt }))
    .filter((a) => a.alt);

  return (
    <div className="mt-2">
      <div className={`grid ${gridClass} gap-0.5 rounded-card overflow-hidden`}>
        {images.map((image, i) => (
          <div
            key={i}
            className="relative cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              handleClick(i);
            }}
          >
            <img
              src={image.thumb}
              alt={image.alt || ""}
              className="w-full h-full object-cover"
              style={{
                aspectRatio: count === 1 ? "16/9" : "1/1",
                maxHeight: count === 1 ? "300px" : "150px",
              }}
            />
          </div>
        ))}
      </div>
      {alts.length > 0 && (
        <div className="mt-1 space-y-0.5">
          {alts.map((a) => (
            <p key={a.index} className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
              {count > 1 && <span className="text-gray-400 dark:text-gray-500 mr-1">[{a.index + 1}]</span>}
              {a.alt}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
