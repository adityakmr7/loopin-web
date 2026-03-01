"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export interface InstagramMediaItem {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
  username: string;
}

export function useAccountMedia(accountId: string | undefined) {
  return useQuery<InstagramMediaItem[]>({
    queryKey: ["instagram", "media", accountId],
    queryFn: async () => {
      const { data } = await api.get(`/instagram/accounts/${accountId}/media?limit=20`);
      return data.data ?? [];
    },
    enabled: !!accountId,
    staleTime: 5 * 60 * 1000, // 5 min — thumbnails are stable
  });
}
