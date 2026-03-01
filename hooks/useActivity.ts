"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export interface ActivityLog {
  id: string;
  userId: string;
  accountId: string;
  ruleId: string | null;
  ruleName: string | null;
  trigger: "comment" | "mention" | "message";
  action: "reply" | "comment_to_dm" | "hide" | "reply_dm";
  status: "success" | "failed" | "skipped";
  targetId: string | null;
  detail: string | null;
  createdAt: string;
}

interface ActivityResult {
  logs: ActivityLog[];
  total: number;
  page: number;
  totalPages: number;
}

interface UseActivityFilters {
  accountId?: string;
  trigger?: string;
  action?: string;
  status?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export function useActivity(filters: UseActivityFilters = {}) {
  const params = new URLSearchParams();
  if (filters.accountId) params.set("accountId", filters.accountId);
  if (filters.trigger) params.set("trigger", filters.trigger);
  if (filters.action) params.set("action", filters.action);
  if (filters.status) params.set("status", filters.status);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));

  return useQuery<ActivityResult>({
    queryKey: ["activity", filters],
    queryFn: async () => {
      const { data } = await api.get(`/activity?${params.toString()}`);
      return data.data;
    },
    staleTime: 30 * 1000,
  });
}
