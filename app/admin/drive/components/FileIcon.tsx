import { Icon, type IconName } from "./Icon";
import { CATEGORY_META, getCategory } from "./utils";
import type { Category } from "./types";

const BY_CATEGORY: Record<Category, IconName> = {
  gambar: "image",
  dokumen: "file",
  video: "video",
  audio: "audio",
  arsip: "archive",
  lainnya: "file",
};

export function FileIcon({
  name,
  mime,
  isFolder,
  className = "h-5 w-5",
}: {
  name: string;
  mime?: string | null;
  isFolder: boolean;
  className?: string;
}) {
  if (isFolder) {
    return <Icon name="folder" className={`${className} text-amber-300`} />;
  }
  const cat = getCategory(name, mime);
  return (
    <Icon
      name={BY_CATEGORY[cat]}
      className={className}
      style={{ color: CATEGORY_META[cat].color }}
    />
  );
}