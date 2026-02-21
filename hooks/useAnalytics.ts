import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export type AnalyticsPeriod = "7d" | "30d" | "90d";

export interface ChartDataPoint {
  date: string;
  triggers: number;
  replies: number;
  likes: number;
}

export interface TopRule {
  id: string;
  name: string;
  trigger: "comment" | "mention" | "message";
  triggerCount: number;
  replyCount: number;
  likeCount: number;
  lastTriggered: string | null;
}

export interface AnalyticsData {
  summary: {
    totalTriggers: number;
    totalRepliesSent: number;
    totalLikes: number;
    replyRate: number;
  };
  chart: ChartDataPoint[];
  topRules: TopRule[];
  triggerBreakdown: {
    comment: number;
    mention: number;
  };
}

export function useAnalytics(
  accountId: string | undefined,
  period: AnalyticsPeriod
) {
  return useQuery<AnalyticsData>({
    queryKey: ["analytics", "overview", accountId, period],
    queryFn: async () => {
      if (!accountId) throw new Error("Account ID is required");
      const { data } = await api.get(
        `/analytics/overview?accountId=${accountId}&period=${period}`
      );
      return data.data;
    },
    enabled: !!accountId,
  });
}
