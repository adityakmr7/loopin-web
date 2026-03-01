"use client";

import { useAccountMedia, type InstagramMediaItem } from "@/hooks/useAccountMedia";
import { CheckCircle2, Loader2, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PostFilterPickerProps {
  accountId: string;
  selectedPostIds: string[];
  onChange: (ids: string[]) => void;
}

function PostThumbnail({
  item,
  selected,
  onClick,
}: {
  item: InstagramMediaItem;
  selected: boolean;
  onClick: () => void;
}) {
  const src = item.thumbnail_url ?? item.media_url;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative aspect-square rounded-md overflow-hidden border-2 transition-all",
        selected
          ? "border-indigo-500 ring-2 ring-indigo-500/30"
          : "border-transparent hover:border-slate-600"
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={item.caption?.slice(0, 60) ?? item.media_type}
        className="h-full w-full object-cover"
      />
      {selected && (
        <div className="absolute inset-0 bg-indigo-500/20 flex items-center justify-center">
          <CheckCircle2 className="h-6 w-6 text-indigo-300 drop-shadow" />
        </div>
      )}
      {item.media_type === "VIDEO" && (
        <div className="absolute bottom-1 right-1 rounded bg-black/60 px-1 py-0.5 text-[10px] text-white">
          ▶
        </div>
      )}
    </button>
  );
}

export function PostFilterPicker({ accountId, selectedPostIds, onChange }: PostFilterPickerProps) {
  const { data: media, isLoading, isError } = useAccountMedia(accountId);

  const toggle = (id: string) => {
    if (selectedPostIds.includes(id)) {
      onChange(selectedPostIds.filter((p) => p !== id));
    } else {
      onChange([...selectedPostIds, id]);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading posts…
      </div>
    );
  }

  if (isError || !media) {
    return (
      <p className="text-sm text-red-400 py-2">
        Failed to load posts. Make sure your account is connected and has posts.
      </p>
    );
  }

  if (media.length === 0) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-slate-500">
        <ImageIcon className="h-4 w-4" />
        No posts found on this account.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
        {media.map((item) => (
          <PostThumbnail
            key={item.id}
            item={item}
            selected={selectedPostIds.includes(item.id)}
            onClick={() => toggle(item.id)}
          />
        ))}
      </div>

      {selectedPostIds.length === 0 ? (
        <p className="text-xs text-slate-500">
          No posts selected — rule will run on <strong className="text-slate-400">all posts</strong>.
        </p>
      ) : (
        <p className="text-xs text-slate-400">
          {selectedPostIds.length} post{selectedPostIds.length > 1 ? "s" : ""} selected — rule will only
          run on comments from these posts.{" "}
          <button
            type="button"
            className="text-indigo-400 hover:underline"
            onClick={() => onChange([])}
          >
            Clear
          </button>
        </p>
      )}
    </div>
  );
}
