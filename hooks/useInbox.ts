"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export interface Conversation {
  id: string;
  accountId: string;
  instagramThreadId: string;
  participantIgId: string;
  participantUsername: string | null;
  lastMessageAt: string | null;
  lastMessageText: string | null;
  isResolved: boolean;
  automationPaused: boolean;
  createdAt: string;
}

export interface InboxMessage {
  id: string;
  conversationId: string;
  instagramMsgId: string;
  direction: "inbound" | "outbound";
  senderIgId: string;
  text: string | null;
  sentAt: string;
  isRead: boolean;
}

export function useConversations(accountId: string | undefined, resolved?: boolean) {
  return useQuery<Conversation[]>({
    queryKey: ["inbox", "conversations", accountId, resolved],
    queryFn: async () => {
      const params = new URLSearchParams({ accountId: accountId! });
      if (resolved !== undefined) params.set("resolved", String(resolved));
      const { data } = await api.get(`/inbox?${params}`);
      return data.data;
    },
    enabled: !!accountId,
    refetchInterval: 30_000,
  });
}

export function useMessages(conversationId: string | undefined) {
  return useQuery<InboxMessage[]>({
    queryKey: ["inbox", "messages", conversationId],
    queryFn: async () => {
      const { data } = await api.get(`/inbox/${conversationId}/messages`);
      return data.data;
    },
    enabled: !!conversationId,
    refetchInterval: 10_000,
  });
}

export function useSendReply() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, text }: { conversationId: string; text: string }) => {
      const { data } = await api.post(`/inbox/${conversationId}/reply`, { text });
      return data.data as InboxMessage;
    },
    onSuccess: (_, { conversationId }) => {
      queryClient.invalidateQueries({ queryKey: ["inbox", "messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["inbox", "conversations"] });
    },
  });
}

export function useResolveConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) => api.post(`/inbox/${conversationId}/resolve`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inbox"] }),
  });
}

export function usePauseAutomation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) => api.post(`/inbox/${conversationId}/pause-automation`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inbox"] }),
  });
}

export function useResumeAutomation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) => api.post(`/inbox/${conversationId}/resume-automation`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inbox"] }),
  });
}
