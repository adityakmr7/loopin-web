"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export interface UserSettings {
  timezone: string;
  maxRepliesPerHour: number;
  replyDelayMinSecs: number;
  replyDelayMaxSecs: number;
  blockedKeywords: string[];
  ignoredUsernames: string[];
  notifyOnTokenExpiry: boolean;
  notifyOnRuleFailure: boolean;
}

export function useSettings() {
  return useQuery<UserSettings>({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data } = await api.get("/settings");
      return data.data;
    },
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patch: Partial<UserSettings>) => {
      const { data } = await api.patch("/settings", patch);
      return data.data as UserSettings;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["settings"], updated);
    },
  });
}
