import { useRef, useCallback, type DragEvent } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "../common/Icon";

interface VideoFile {
  file: File;
  preview: string;
  alt: string;
}

interface VideoUploadProps {
  video: VideoFile | null;
  onSelect: (file: File) => void;
  onRemove: () => void;
  onUpdateAlt: (alt: string) => void;
  disabled?: boolean;
}

const MAX_SIZE = 100 * 1024 * 1024; // 100MB
const ACCEPTED_MIMES = ["video/mp4", "video/webm", "video/mpeg", "video/quicktime"];
const ACCEPTED_EXTS = [".mp4", ".webm", ".mpeg", ".mov"];
const ACCEPT_ATTR = [...ACCEPTED_MIMES, ...ACCEPTED_EXTS].join(",");

function isAcceptedVideo(file: File): boolean {
  if (ACCEPTED_MIMES.includes(file.type)) return true;
  // Fallback: check file extension (file.type can be empty for .mov on some platforms)
  const ext = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];
  return ext ? ACCEPTED_EXTS.includes(ext) : false;
}

export function VideoUpload({ video, onSelect, onRemove, onUpdateAlt, disabled }: VideoUploadProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!isAcceptedVideo(file)) return;
      if (file.size > MAX_SIZE) return;
      onSelect(file);
    },
    [onSelect],
  );

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
  };

  if (video) {
    return (
      <div className="flex flex-col gap-1">
        <div className="relative group">
          <video
            src={video.preview}
            className="w-full max-h-48 rounded object-contain bg-black"
            muted
          />
          <button
            onClick={onRemove}
            className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Icon name="close" size={16} />
          </button>
          <div className="absolute bottom-1 left-1 flex items-center gap-1 px-1.5 py-0.5 bg-black/60 text-white text-[10px] rounded">
            <Icon name="videocam" size={12} />
            <span>{(video.file.size / (1024 * 1024)).toFixed(1)}MB</span>
          </div>
        </div>
        <input
          type="text"
          value={video.alt}
          onChange={(e) => onUpdateAlt(e.target.value)}
          placeholder={t("video.altPlaceholder")}
          className="w-full text-[11px] px-1.5 py-1 rounded border border-border-light dark:border-border-dark bg-transparent text-text-light dark:text-text-dark placeholder-gray-400 focus:outline-none focus:border-primary"
        />
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`border-2 border-dashed border-border-light rounded-btn p-3 text-center text-xs text-gray-400 transition-colors ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-primary hover:text-primary"
      }`}
    >
      <Icon name="videocam" size={16} className="inline-block mr-1 align-text-bottom" />
      {t("video.addVideo")}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export type { VideoFile };
