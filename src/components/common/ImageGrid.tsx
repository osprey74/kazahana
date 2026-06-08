import { useTranslation } from "react-i18next";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useLightboxStore } from "../../stores/lightboxStore";
import { useSettingsStore } from "../../stores/settingsStore";
import { CAROUSEL_THRESHOLD, type MediaImage } from "../../lib/embed/gallery";

interface ImageGridProps {
  images: MediaImage[];
}

const ALT_TRUNCATE_LENGTH = 128;

export function ImageGrid({ images }: ImageGridProps) {
  const { t } = useTranslation();
  const openLightbox = useLightboxStore((s) => s.open);
  const imageOpenMode = useSettingsStore((s) => s.imageOpenMode);
  const count = images.length;

  if (count === 0) return null;

  const truncateAlt = (alt: string) =>
    alt.length > ALT_TRUNCATE_LENGTH ? alt.slice(0, ALT_TRUNCATE_LENGTH) + "…" : alt;

  const handleClick = (index: number) => {
    if (imageOpenMode === "external") {
      openUrl(images[index].fullsize);
      return;
    }
    openLightbox(
      images.map((img) => ({
        fullsize: img.fullsize,
        thumb: img.thumb,
        alt: img.alt || "",
      })),
      index,
    );
  };

  const hasAnyAlt = images.some((img) => img.alt);
  const isCarousel = count > CAROUSEL_THRESHOLD;

  return (
    <div className="mt-2">
      {isCarousel ? (
        <CarouselLayout images={images} onClick={handleClick} count={count} />
      ) : (
        <GridLayout images={images} onClick={handleClick} count={count} />
      )}
      {count === 1 && images[0].alt ? (
        <div className="mt-1">
          <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
            {truncateAlt(images[0].alt)}
          </p>
        </div>
      ) : count > 1 && hasAnyAlt ? (
        <div className="mt-1 space-y-0.5">
          {images.map((img, i) => (
            <p key={i} className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
              <span className="text-gray-400 dark:text-gray-500 mr-1">
                [{t("image.imageLabel", { n: i + 1 })}]
              </span>
              {img.alt ? truncateAlt(img.alt) : <span className="italic">{t("image.noAlt")}</span>}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

interface LayoutProps {
  images: MediaImage[];
  onClick: (index: number) => void;
  count: number;
}

function GridLayout({ images, onClick, count }: LayoutProps) {
  return (
    <div className="grid grid-cols-2 gap-0.5 rounded-card overflow-hidden">
      {images.map((image, i) => (
        <div
          key={i}
          className="relative cursor-pointer"
          style={{ gridColumn: count === 1 ? "span 2" : undefined }}
          onClick={(e) => {
            e.stopPropagation();
            onClick(i);
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
  );
}

function CarouselLayout({ images, onClick, count }: LayoutProps) {
  return (
    <div
      className="flex gap-1 overflow-x-auto snap-x snap-mandatory rounded-card scrollbar-thin"
      onClick={(e) => e.stopPropagation()}
    >
      {images.map((image, i) => (
        <div
          key={i}
          className="relative flex-shrink-0 snap-start cursor-pointer w-[60%] sm:w-[45%] md:w-[33%]"
          onClick={(e) => {
            e.stopPropagation();
            onClick(i);
          }}
        >
          <img
            src={image.thumb}
            alt={image.alt || ""}
            className="w-full h-[220px] object-cover rounded-card"
          />
          <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full bg-black/55 text-white text-[10px] font-medium leading-none">
            {i + 1}/{count}
          </div>
        </div>
      ))}
    </div>
  );
}
