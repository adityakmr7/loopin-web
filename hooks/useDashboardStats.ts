import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export interface Interaction {
  id: string;
  commenter: {
    username: string;
  };
  comment: {
    text: string;
    timestamp: string;
  };
  reply: {
    sent: boolean;
    text?: string;
    repliedAt?: string;
  };
}

export interface DashboardStats {
  activeRules: number;
  eventsProcessed: {
    total: number;
    period: string;
  };
  autoReplies: {
    total: number;
    period: string;
  };
  recentInteractions: Interaction[];
}

export function useDashboardStats(accountId: string | undefined) {
  return useQuery<DashboardStats>({
    queryKey: ["dashboard", "stats", accountId],
    queryFn: async () => {
      if (!accountId) {
        throw new Error("Account ID is required");
      }

      const { data } = await api.get(`/dashboard/stats?accountId=${accountId}`);
      return data.data;
    },
    enabled: !!accountId,
    refetchInterval: 30000, // Poll every 30 seconds for real-time updates
  });
}
