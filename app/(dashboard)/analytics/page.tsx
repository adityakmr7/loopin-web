"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAnalytics, AnalyticsPeriod } from "@/hooks/useAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  MessageSquare,
  AtSign,
  ThumbsUp,
  TrendingUp,
  Loader2,
  BarChart2,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { format, parseISO } from "date-fns";

interface Account {
  id: string;
  username: string;
}

const PERIOD_LABELS: Record<AnalyticsPeriod, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
};

function StatCard({
  title,
  value,
  icon: Icon,
  iconColor,
  sub,
  loading,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  iconColor: string;
  sub?: string;
  loading?: boolean;
}) {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-slate-400">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
        ) : (
          <>
            <div className="text-2xl font-bold text-slate-50">{value}</div>
            {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl text-sm">
      <p className="text-slate-400 mb-2 font-medium">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-300 capitalize">{p.name}:</span>
          <span className="text-slate-100 font-semibold">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>("30d");

  const { data: accounts } = useQuery<Account[]>({
    queryKey: ["instagram", "accounts"],
    queryFn: async () => {
      const { data } = await api.get("/instagram/accounts");
      return data.data || [];
    },
  });

  const accountId = accounts?.[0]?.id;

  const { data, isLoading, isError } = useAnalytics(accountId, period);

  const chartData =
    data?.chart.map((d) => ({
      ...d,
      date: format(parseISO(d.date), "MMM d"),
    })) ?? [];

  const breakdownData = data
    ? [
        { name: "Comments", value: data.triggerBreakdown.comment, color: "#6366f1" },
        { name: "Mentions", value: data.triggerBreakdown.mention, color: "#a78bfa" },
      ]
    : [];

  const triggerIcons: Record<string, React.ElementType> = {
    comment: MessageSquare,
    mention: AtSign,
    message: MessageSquare,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-slate-400">Track your automation performance</p>
        </div>

        <Tabs value={period} onValueChange={(v) => setPeriod(v as AnalyticsPeriod)}>
          <TabsList className="bg-slate-900 border border-slate-800">
            <TabsTrigger value="7d" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">7d</TabsTrigger>
            <TabsTrigger value="30d" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">30d</TabsTrigger>
            <TabsTrigger value="90d" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">90d</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* No account state */}
      {!accountId && !isLoading && (
        <Card className="bg-slate-900 border-slate-800 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BarChart2 className="h-10 w-10 text-slate-600 mb-4" />
            <p className="text-slate-400 font-medium">No Instagram account connected</p>
            <p className="text-slate-500 text-sm mt-1">Connect an account to see your analytics</p>
          </CardContent>
        </Card>
      )}

      {accountId && (
        <>
          {/* Summary Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Triggers"
              value={data?.summary.totalTriggers ?? 0}
              icon={Zap}
              iconColor="text-amber-400"
              sub={PERIOD_LABELS[period]}
              loading={isLoading}
            />
            <StatCard
              title="Replies Sent"
              value={data?.summary.totalRepliesSent ?? 0}
              icon={MessageSquare}
              iconColor="text-blue-400"
              sub="Auto-replies delivered"
              loading={isLoading}
            />
            <StatCard
              title="Likes Given"
              value={data?.summary.totalLikes ?? 0}
              icon={ThumbsUp}
              iconColor="text-pink-400"
              sub="Comments liked"
              loading={isLoading}
            />
            <StatCard
              title="Reply Rate"
              value={data ? `${data.summary.replyRate}%` : "0%"}
              icon={TrendingUp}
              iconColor="text-emerald-400"
              sub="Triggers that got a reply"
              loading={isLoading}
            />
          </div>

          {/* Activity Chart */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Activity Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                </div>
              ) : isError ? (
                <div className="flex items-center justify-center h-64 text-slate-500">
                  Failed to load chart data
                </div>
              ) : chartData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                  <BarChart2 className="h-8 w-8 mb-3 opacity-30" />
                  <p>No activity in this period</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      axisLine={{ stroke: "#1e293b" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: "12px", color: "#94a3b8", paddingTop: "16px" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="triggers"
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: "#6366f1" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="replies"
                      stroke="#22d3ee"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: "#22d3ee" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="likes"
                      stroke="#f472b6"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: "#f472b6" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Top Rules */}
            <Card className="bg-slate-900 border-slate-800 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Top Performing Rules</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                  </div>
                ) : !data?.topRules.length ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-sm">
                    <Zap className="h-7 w-7 mb-3 opacity-20" />
                    No rules have triggered yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.topRules.slice(0, 5).map((rule, idx) => {
                      const Icon = triggerIcons[rule.trigger] ?? Zap;
                      const maxTriggers = data.topRules[0].triggerCount || 1;
                      const pct = Math.round((rule.triggerCount / maxTriggers) * 100);
                      return (
                        <div key={rule.id} className="flex items-center gap-4 p-3 rounded-lg bg-slate-950 border border-slate-800">
                          <span className="text-slate-600 text-xs font-mono w-4">{idx + 1}</span>
                          <div className="p-1.5 rounded-md bg-slate-800">
                            <Icon className="h-3.5 w-3.5 text-indigo-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-200 truncate">{rule.name}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-indigo-500 rounded-full transition-all"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-400 shrink-0">
                            <span className="flex items-center gap-1">
                              <Zap className="h-3 w-3 text-amber-400" />
                              {rule.triggerCount}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3 text-blue-400" />
                              {rule.replyCount}
                            </span>
                            <Badge
                              variant="outline"
                              className="border-slate-700 text-slate-500 text-xs capitalize"
                            >
                              {rule.trigger}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Trigger Breakdown */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Trigger Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                  </div>
                ) : !data || (data.triggerBreakdown.comment === 0 && data.triggerBreakdown.mention === 0) ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-sm">
                    <BarChart2 className="h-7 w-7 mb-3 opacity-20" />
                    No data yet
                  </div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={breakdownData} barSize={36}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: "#64748b", fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis hide />
                        <Tooltip
                          cursor={{ fill: "rgba(255,255,255,0.03)" }}
                          content={<CustomTooltip />}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {breakdownData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>

                    <div className="mt-4 space-y-2">
                      {breakdownData.map((item) => (
                        <div key={item.name} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ background: item.color }}
                            />
                            <span className="text-slate-400">{item.name}</span>
                          </div>
                          <span className="font-semibold text-slate-200">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
