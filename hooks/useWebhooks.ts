"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";

export type WebhookEventType = "rule_matched" | "dm_received" | "comment_received" | "broadcast_completed";

export interface OutboundWebhook {
  id: string;
  name: string;
  url: string;
  events: WebhookEventType[];
  secret: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function useWebhooks() {
  return useQuery<OutboundWebhook[]>({
    queryKey: ["webhooks"],
    queryFn: async () => {
      const { data } = await api.get("/webhooks");
      return data.data;
    },
  });
}

export function useCreateWebhook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; url: string; events: WebhookEventType[]; secret?: string }) => {
      const { data } = await api.post("/webhooks", payload);
      return data.data as OutboundWebhook;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
      toast.success("Webhook created!");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error ?? "Failed to create webhook");
    },
  });
}

export function useUpdateWebhook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<OutboundWebhook> & { id: string }) => {
      const { data } = await api.patch(`/webhooks/${id}`, payload);
      return data.data as OutboundWebhook;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error ?? "Failed to update webhook");
    },
  });
}

export function useDeleteWebhook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/webhooks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
      toast.success("Webhook deleted");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error ?? "Failed to delete webhook");
    },
  });
}

export function useTestWebhook() {
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/webhooks/${id}/test`);
      return data.data as { statusCode: number; ok: boolean };
    },
    onSuccess: (result) => {
      if (result.ok) {
        toast.success(`Test delivery succeeded (HTTP ${result.statusCode})`);
      } else {
        toast.warning(`Test delivered but got HTTP ${result.statusCode}`);
      }
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error ?? "Test delivery failed");
    },
  });
}
