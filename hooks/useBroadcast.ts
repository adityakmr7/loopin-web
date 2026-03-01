"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export interface Broadcast {
  id: string;
  accountId: string;
  name: string;
  message: string;
  tagFilter: string[];
  status: "draft" | "scheduled" | "running" | "completed" | "failed";
  scheduledAt: string | null;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BroadcastRecipient {
  id: string;
  broadcastId: string;
  contactId: string;
  status: "pending" | "sent" | "failed";
  error: string | null;
  sentAt: string | null;
  createdAt: string;
  contact: {
    username: string;
    displayName: string | null;
    profilePictureUrl: string | null;
  };
}

export function useBroadcasts(accountId: string | undefined) {
  return useQuery({
    queryKey: ["broadcasts", accountId],
    queryFn: async () => {
      const { data } = await api.get(`/broadcasts?accountId=${accountId}`);
      return data.data as Broadcast[];
    },
    enabled: !!accountId,
  });
}

export function useBroadcast(id: string | undefined) {
  const query = useQuery({
    queryKey: ["broadcasts", "detail", id],
    queryFn: async () => {
      const { data } = await api.get(`/broadcasts/${id}`);
      return data.data as Broadcast;
    },
    enabled: !!id,
    refetchInterval: (query) => {
      const broadcast = query.state.data as Broadcast | undefined;
      return broadcast?.status === "running" || broadcast?.status === "scheduled" ? 10000 : false;
    },
  });
  return query;
}

export function useBroadcastRecipients(
  id: string | undefined,
  filters: { status?: string; page?: number; limit?: number }
) {
  return useQuery({
    queryKey: ["broadcasts", "recipients", id, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.set("status", filters.status);
      params.set("page", String(filters.page ?? 1));
      params.set("limit", String(filters.limit ?? 20));
      const { data } = await api.get(`/broadcasts/${id}/recipients?${params}`);
      return data as {
        data: BroadcastRecipient[];
        total: number;
        page: number;
        totalPages: number;
      };
    },
    enabled: !!id,
  });
}

export function useCreateBroadcast() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (input: {
      accountId: string;
      name: string;
      message: string;
      tagFilter?: string[];
    }) => {
      const { data } = await api.post("/broadcasts", input);
      return data.data as { broadcast: Broadcast; estimatedCount: number };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["broadcasts"] });
      router.push(`/broadcasts/${result.broadcast.id}`);
    },
  });
}

export function useSendBroadcast() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      broadcastId,
      scheduledAt,
    }: {
      broadcastId: string;
      scheduledAt?: string; // ISO string or undefined for immediate send
    }) => {
      const body = scheduledAt ? { scheduledAt } : undefined;
      const { data } = await api.post(`/broadcasts/${broadcastId}/send`, body ?? {});
      return data.data as Broadcast;
    },
    onSuccess: (broadcast) => {
      queryClient.invalidateQueries({ queryKey: ["broadcasts", "detail", broadcast.id] });
      queryClient.invalidateQueries({ queryKey: ["broadcasts", broadcast.accountId] });
    },
  });
}

export function useCancelScheduledBroadcast() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (broadcastId: string) => {
      const { data } = await api.post(`/broadcasts/${broadcastId}/cancel-schedule`);
      return data.data as Broadcast;
    },
    onSuccess: (broadcast) => {
      queryClient.invalidateQueries({ queryKey: ["broadcasts", "detail", broadcast.id] });
      queryClient.invalidateQueries({ queryKey: ["broadcasts", broadcast.accountId] });
    },
  });
}

export function useDeleteBroadcast() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (broadcastId: string) => {
      await api.delete(`/broadcasts/${broadcastId}`);
      return broadcastId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["broadcasts"] });
    },
  });
}

export function useEstimatedAudience(accountId: string | undefined, tagFilter: string[]) {
  return useQuery({
    queryKey: ["broadcasts", "estimate", accountId, tagFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ accountId: accountId! });
      if (tagFilter.length > 0) params.set("tagFilter", tagFilter.join(","));
      const { data } = await api.get(`/broadcasts/estimate?${params}`);
      return data.data.count as number;
    },
    enabled: !!accountId,
  });
}
