import type { ViewImage } from "@atproto/api/dist/client/types/app/bsky/embed/images";
import { useTranslation } from "react-i18next";
import { useLightboxStore } from "../../stores/lightboxStore";

interface ImageGridProps {
  images: ViewImage[];
}

export function ImageGrid({ images }: ImageGridProps) {
  const { t } = useTranslation();
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

  // For single image: show alt only if present
  // For multiple images: show all images' alt status
  const hasAnyAlt = images.some((img) => img.alt);

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
      {count === 1 && images[0].alt ? (
        <div className="mt-1">
          <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
            {images[0].alt}
          </p>
        </div>
      ) : count > 1 && hasAnyAlt ? (
        <div className="mt-1 space-y-0.5">
          {images.map((img, i) => (
            <p key={i} className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
              <span className="text-gray-400 dark:text-gray-500 mr-1">[{t("image.imageLabel", { n: i + 1 })}]</span>
              {img.alt || <span className="italic">{t("image.noAlt")}</span>}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
