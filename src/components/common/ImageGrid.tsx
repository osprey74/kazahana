import type { ViewImage } from "@atproto/api/dist/client/types/app/bsky/embed/images";

interface ImageGridProps {
  images: ViewImage[];
}

export function ImageGrid({ images }: ImageGridProps) {
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

  return (
    <div className={`grid ${gridClass} gap-0.5 rounded-card overflow-hidden mt-2`}>
      {images.map((image, i) => (
        <div
          key={i}
          className={`relative ${count === 3 && i === 0 ? "row-span-2" : ""}`}
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
  );
}
