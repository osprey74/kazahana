import { openUrl } from "@tauri-apps/plugin-opener";

interface ExternalEmbed {
  uri: string;
  title: string;
  description: string;
  thumb?: string;
}

interface LinkCardProps {
  external: ExternalEmbed;
}

export function LinkCard({ external }: LinkCardProps) {
  const domain = getDomain(external.uri);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openUrl(external.uri);
  };

  return (
    <button
      onClick={handleClick}
      className="mt-2 w-full border border-border-light dark:border-border-dark rounded-card overflow-hidden text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
    >
      {external.thumb && (
        <img
          src={external.thumb}
          alt=""
          className="w-full h-32 object-cover"
          loading="lazy"
        />
      )}
      <div className="px-3 py-2">
        <p className="text-xs text-gray-500 truncate">{domain}</p>
        {external.title && (
          <p className="text-sm font-medium text-text-light dark:text-text-dark line-clamp-2 leading-snug">
            {external.title}
          </p>
        )}
        {external.description && (
          <p className="text-xs text-gray-500 line-clamp-2 mt-0.5 leading-snug">
            {external.description}
          </p>
        )}
      </div>
    </button>
  );
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
