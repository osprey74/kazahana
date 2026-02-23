import { useRef, useEffect, useState } from "react";
import Hls from "hls.js";
import { useSettingsStore } from "../../stores/settingsStore";

interface VideoPlayerProps {
  playlist: string;
  thumbnail?: string;
  alt?: string;
  aspectRatio?: { width: number; height: number };
  presentation?: string;
}

export function VideoPlayer({ playlist, thumbnail, alt, aspectRatio, presentation }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [started, setStarted] = useState(presentation === "gif");
  const videoVolume = useSettingsStore((s) => s.videoVolume);

  useEffect(() => {
    if (!started) return;
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;
      hls.loadSource(playlist);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.volume = videoVolume / 100;
        video.play().catch(() => {});
      });
      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari native HLS
      video.src = playlist;
      video.addEventListener("loadedmetadata", () => {
        video.volume = videoVolume / 100;
        video.play().catch(() => {});
      });
    }
  }, [playlist, started, videoVolume]);

  const isGif = presentation === "gif";
  const ratio = aspectRatio ? `${aspectRatio.width} / ${aspectRatio.height}` : "16 / 9";

  // GIF-style: autoplay, muted, loop, no controls
  if (isGif) {
    return (
      <video
        ref={videoRef}
        className="w-full rounded-lg mt-2"
        style={{ aspectRatio: ratio }}
        muted
        loop
        playsInline
        autoPlay
      />
    );
  }

  // Normal video: show thumbnail until user clicks play
  if (!started) {
    return (
      <button
        onClick={() => setStarted(true)}
        className="relative w-full mt-2 rounded-lg overflow-hidden bg-black group"
        style={{ aspectRatio: ratio }}
      >
        {thumbnail && (
          <img src={thumbnail} alt={alt ?? ""} className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M6 4L16 10L6 16V4Z" fill="#333" />
            </svg>
          </div>
        </div>
        {alt && (
          <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 text-white text-[10px] rounded">
            ALT
          </div>
        )}
      </button>
    );
  }

  return (
    <video
      ref={videoRef}
      className="w-full rounded-lg mt-2"
      style={{ aspectRatio: ratio }}
      controls
      playsInline
    />
  );
}
