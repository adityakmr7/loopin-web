"use client";

import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Instagram, MessageSquare, Zap, Activity, AtSign } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useDashboardStats, type Interaction } from "@/hooks/useDashboardStats";
import { formatDistanceToNow, parseISO } from "date-fns";

export default function DashboardPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Handle OAuth Redirects
  useEffect(() => {
    if (searchParams.get("instagram_connected") === "true") {
      toast.success("Instagram Connected!", {
        description: "Your account is now linked and ready for automation.",
      });
      // Clean URL
      router.replace("/dashboard");
    }
    
    const error = searchParams.get("error");
    if (error) {
       toast.error("Connection Failed", {
        description: decodeURIComponent(error),
       });
       router.replace("/dashboard");
    }
  }, [searchParams, router]);

  // Fetch dashboard overview data
  const { data: overview, isLoading: isLoadingOverview } = useQuery({
    queryKey: ["dashboard", "overview"],
    queryFn: async () => {
      const { data } = await api.get("/dashboard/overview");
      return data.data;
    },
  });

  const { data: accounts, isLoading } = useQuery({
    queryKey: ["instagram", "accounts"],
    queryFn: async () => {
      const { data } = await api.get("/instagram/accounts");
      return data.data || [];
    }
  });

  const connectedAccount = overview?.accounts?.[0] || accounts?.[0];

  // Fetch dashboard stats with recent activity
  const { data: dashboardStats, isLoading: isLoadingStats } = useDashboardStats(connectedAccount?.id);

  // Use stats from the new API if available, otherwise fall back to overview
  const stats = {
     activeRules: dashboardStats?.activeRules ?? overview?.totalActiveRules ?? 0,
     eventsProcessed: dashboardStats?.eventsProcessed.total ?? overview?.totalEventsProcessed ?? 0,
     autoReplies: dashboardStats?.autoReplies.total ?? overview?.totalAutoReplies ?? 0,
  };

  // ── Interaction row sub-component ────────────────────────────────────────
  function InteractionRow({ item }: { item: Interaction }) {
    return (
      <div className="flex flex-col gap-2 p-3 bg-slate-950 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
        {/* Commenter + comment bubble */}
        <div className="flex items-start gap-2.5">
          <div className="shrink-0 h-7 w-7 rounded-full bg-slate-800 flex items-center justify-center">
            <AtSign className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-indigo-400">@{item.commenter.username}</span>
            <div className="mt-1 rounded-lg rounded-tl-none bg-slate-800 px-3 py-2 text-sm text-slate-200 max-w-prose">
              {item.comment.text}
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              {formatDistanceToNow(parseISO(item.comment.timestamp), { addSuffix: true })}
            </p>
          </div>
        </div>

        {/* Reply bubble — indented */}
        <div className="flex items-start gap-2.5 pl-9">
          <div className="shrink-0 h-7 w-7 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
            <Zap className="h-3.5 w-3.5 text-indigo-400" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-slate-400">Loopin</span>
            {item.reply.sent ? (
              <>
                <div className="mt-1 rounded-lg rounded-tl-none bg-indigo-600/15 border border-indigo-500/20 px-3 py-2 text-sm text-indigo-100 max-w-prose">
                  {item.reply.text}
                </div>
                {item.reply.repliedAt && (
                  <p className="mt-1 text-[11px] text-slate-500">
                    {formatDistanceToNow(parseISO(item.reply.repliedAt), { addSuffix: true })}
                  </p>
                )}
              </>
            ) : (
              <div className="mt-1 inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800/50 px-2.5 py-1 text-xs text-slate-500">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                No reply sent
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-slate-400">Welcome back, {user?.name}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Account Card */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Connected Account
            </CardTitle>
            <Instagram className="h-4 w-4 text-indigo-400" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
               <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
            ) : connectedAccount ? (
               <div>
                 <div className="text-xl font-bold truncate">@{connectedAccount.username}</div>
                 <p className="text-xs text-slate-500 mt-1">
                   {(connectedAccount.followersCount || 0).toLocaleString()} followers
                 </p>
               </div>
            ) : (
               <div>
                  <div className="text-sm text-slate-500 mb-3">No account connected</div>
                  <Button size="sm" variant="outline" className="w-full border-slate-700 hover:bg-slate-800" asChild>
                    <Link href="/accounts">Connect</Link>
                  </Button>
               </div>
            )}
          </CardContent>
        </Card>
        
        {/* Stats Cards */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Active Rules
            </CardTitle>
            <Zap className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            {isLoadingOverview && isLoadingStats ? (
              <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.activeRules}</div>
                <p className="text-xs text-slate-500">Automation rules running</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Events Processed
            </CardTitle>
            <Activity className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            {isLoadingOverview && isLoadingStats ? (
              <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.eventsProcessed}</div>
                <p className="text-xs text-slate-500">In the last 30 days</p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Auto Replies Sent
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            {isLoadingOverview && isLoadingStats ? (
              <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.autoReplies}</div>
                <p className="text-xs text-slate-500">Comments with a reply sent</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Interactions */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle>Recent Interactions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingStats ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          ) : dashboardStats?.recentInteractions && dashboardStats.recentInteractions.length > 0 ? (
            <div className="space-y-3">
              {dashboardStats.recentInteractions.map((item) => (
                <InteractionRow key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
              <Activity className="h-10 w-10 mb-4 opacity-20" />
              <p className="text-lg font-medium text-slate-400">No interactions yet</p>
              <p className="text-sm max-w-sm mt-2">
                Once your rules start triggering, you&apos;ll see a live feed of comment threads here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
