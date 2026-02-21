import { useRef, useCallback, type DragEvent } from "react";

interface ImageFile {
  id: string;
  file: File;
  preview: string;
}

interface ImageUploadProps {
  images: ImageFile[];
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
}

const MAX_IMAGES = 4;
const MAX_SIZE = 1_000_000; // 1MB
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

export function ImageUpload({ images, onAdd, onRemove }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList).filter((f) => {
        if (!ACCEPTED.includes(f.type)) return false;
        if (f.size > MAX_SIZE) return false;
        return true;
      });
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
        <div className="grid grid-cols-2 gap-1 mb-2">
          {images.map((img) => (
            <div key={img.id} className="relative group">
              <img
                src={img.preview}
                alt=""
                className="w-full h-24 object-cover rounded"
              />
              <button
                onClick={() => onRemove(img.id)}
                className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                x
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
          画像を追加（最大{MAX_IMAGES}枚、1MB以下）
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
