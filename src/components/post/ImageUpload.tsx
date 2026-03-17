import { useRef, useCallback, useState, type DragEvent } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "../common/Icon";
import { AltTextDialog } from "./AltTextDialog";

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
  const [altDialogTarget, setAltDialogTarget] = useState<ImageFile | null>(null);

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
              <button
                type="button"
                onClick={() => setAltDialogTarget(img)}
                className={`w-full text-[11px] px-1.5 py-1 rounded border truncate transition-colors ${
                  img.alt
                    ? "text-left border-primary/40 bg-primary/5 text-primary dark:text-blue-300"
                    : "text-center border-border-light dark:border-border-dark bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-primary"
                }`}
              >
                {img.alt ? `ALT: ${img.alt}` : t("image.addAlt")}
              </button>
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

      {/* ALT text dialog */}
      {altDialogTarget && (
        <AltTextDialog
          imagePreview={altDialogTarget.preview}
          imageFile={altDialogTarget.file}
          alt={altDialogTarget.alt}
          onSave={(newAlt) => onUpdateAlt(altDialogTarget.id, newAlt)}
          onClose={() => setAltDialogTarget(null)}
        />
      )}
    </div>
  );
}

export type { ImageFile };
