import { useRef, useCallback, type DragEvent } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "../common/Icon";

interface ImageFile {
  id: string;
  file: File;
  preview: string;
  alt: string;
}

interface ImageUploadProps {
  images: ImageFile[];
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
  onUpdateAlt: (id: string, alt: string) => void;
  onEdit?: (id: string) => void;
}

const MAX_IMAGES = 4;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

export function ImageUpload({ images, onAdd, onRemove, onUpdateAlt, onEdit }: ImageUploadProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList).filter((f) => ACCEPTED.includes(f.type));
      const remaining = MAX_IMAGES - images.length;
      if (remaining > 0) {
        onAdd(files.slice(0, remaining));
      }
    },
    [images.length, onAdd],
  );

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
  };

  return (
    <div>
      {/* Preview grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-2">
          {images.map((img) => (
            <div key={img.id} className="flex flex-col gap-1">
              <div className="relative group">
                <img
                  src={img.preview}
                  alt=""
                  className="w-full h-24 object-cover rounded"
                />
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => onEdit(img.id)}
                    className="absolute top-1 left-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title={t("image.edit")}
                  >
                    <Icon name="edit" size={12} />
                  </button>
                )}
                <button
                  onClick={() => onRemove(img.id)}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  x
                </button>
              </div>
              <input
                type="text"
                value={img.alt}
                onChange={(e) => onUpdateAlt(img.id, e.target.value)}
                placeholder={t("image.altPlaceholder")}
                className="w-full text-[11px] px-1.5 py-1 rounded border border-border-light dark:border-border-dark bg-transparent text-text-light dark:text-text-dark placeholder-gray-400 focus:outline-none focus:border-primary"
              />
            </div>
          ))}
        </div>
      )}

      {/* Drop zone / Add button */}
      {images.length < MAX_IMAGES && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-border-light rounded-btn p-3 text-center text-xs text-gray-400 cursor-pointer hover:border-primary hover:text-primary transition-colors"
        >
          {t("image.addImages", { max: MAX_IMAGES })}
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED.join(",")}
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      )}
    </div>
  );
}

export type { ImageFile };
