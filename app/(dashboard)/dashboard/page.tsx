"use client";

import { useAuth } from "@/hooks/use-auth";
import { Instagram, MessageSquare, Zap, Activity, AtSign, Mail, ArrowRight, Plus } from "lucide-react";
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
import { cn } from "@/lib/utils";

function getGreeting(name?: string) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return name ? `${greeting}, ${name.split(" ")[0]}` : greeting;
}

// ── Stat card ────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
  loading,
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ElementType;
  accent: string;
  loading?: boolean;
}) {
  return (
    <div className={cn("relative rounded-xl border border-slate-800 bg-slate-900 p-5 overflow-hidden group hover:border-slate-700 transition-colors")}>
      {/* Accent bar */}
      <div className={cn("absolute top-0 left-0 right-0 h-0.5", accent)} />
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", accent.replace("bg-", "bg-").replace("/80", "/10"))}>
          <Icon className="h-4 w-4 text-slate-400" />
        </div>
      </div>
      {loading ? (
        <div className="h-8 w-20 rounded bg-slate-800 animate-pulse" />
      ) : (
        <>
          <p className="text-2xl font-bold text-slate-50 tabular-nums">{value}</p>
          <p className="text-xs text-slate-500 mt-1">{sub}</p>
        </>
      )}
    </div>
  );
}

// ── Interaction row ───────────────────────────────────────────────────────────
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

      {/* Reply bubble */}
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
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                {item.reply.repliedAt && (
                  <p className="text-[11px] text-slate-500">
                    {formatDistanceToNow(parseISO(item.reply.repliedAt), { addSuffix: true })}
                  </p>
                )}
                {item.dmSent && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/40 border border-emerald-700/40 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                    <Mail className="h-2.5 w-2.5" />
                    DM sent
                  </span>
                )}
              </div>
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

export default function DashboardPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("instagram_connected") === "true") {
      toast.success("Instagram connected!", {
        description: "Your account is now linked and ready for automation.",
      });
      router.replace("/dashboard");
    }
    const error = searchParams.get("error");
    if (error) {
      toast.error("Connection failed", { description: decodeURIComponent(error) });
      router.replace("/dashboard");
    }
  }, [searchParams, router]);

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
    },
  });

  const connectedAccount = overview?.accounts?.[0] || accounts?.[0];
  const { data: dashboardStats, isLoading: isLoadingStats } = useDashboardStats(connectedAccount?.id);

  const stats = {
    activeRules: dashboardStats?.activeRules ?? overview?.totalActiveRules ?? 0,
    eventsProcessed: dashboardStats?.eventsProcessed.total ?? overview?.totalEventsProcessed ?? 0,
    autoReplies: dashboardStats?.autoReplies.total ?? overview?.totalAutoReplies ?? 0,
  };

  const isNewUser = !isLoading && !isLoadingOverview && !connectedAccount;

  return (
    <div className="space-y-8">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {getGreeting(user?.name)}
          </h1>
          <p className="text-slate-400 mt-1">
            {isNewUser
              ? "Let's set up your first automation rule."
              : "Here's what's happening with your Instagram automation."}
          </p>
        </div>
        {!isNewUser && (
          <Button asChild className="bg-indigo-600 hover:bg-indigo-500 text-white shrink-0">
            <Link href="/automation/new">
              <Plus className="h-4 w-4 mr-2" />
              New Rule
            </Link>
          </Button>
        )}
      </div>

      {/* ── New-user quick-start banner ───────────────────────────────────── */}
      {isNewUser && (
        <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-6">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-indigo-600/20 flex items-center justify-center shrink-0">
              <Zap className="h-5 w-5 text-indigo-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-100">Get started in 3 steps</h3>
              <p className="text-sm text-slate-400 mt-1">
                Connect your Instagram account to unlock automation, analytics, and your contact database.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white">
                  <Link href="/accounts">
                    <Instagram className="h-3.5 w-3.5 mr-1.5" />
                    Connect Instagram
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                  <Link href="/automation/new">
                    Create your first rule
                    <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Stat cards ───────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Connected account */}
        <div className="relative rounded-xl border border-slate-800 bg-slate-900 p-5 overflow-hidden hover:border-slate-700 transition-colors">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500" />
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Account</p>
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <Instagram className="h-4 w-4 text-slate-400" />
            </div>
          </div>
          {isLoading ? (
            <div className="space-y-2">
              <div className="h-6 w-32 rounded bg-slate-800 animate-pulse" />
              <div className="h-3 w-20 rounded bg-slate-800 animate-pulse" />
            </div>
          ) : connectedAccount ? (
            <>
              <p className="text-xl font-bold text-slate-50 truncate">@{connectedAccount.username}</p>
              <p className="text-xs text-slate-500 mt-1">
                {(connectedAccount.followersCount || 0).toLocaleString()} followers
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-500 mb-3">No account connected</p>
              <Button size="sm" variant="outline" className="border-slate-700 hover:bg-slate-800 text-xs h-7" asChild>
                <Link href="/accounts">Connect →</Link>
              </Button>
            </>
          )}
        </div>

        <StatCard
          label="Active Rules"
          value={stats.activeRules}
          sub="Automation rules running"
          icon={Zap}
          accent="bg-gradient-to-r from-amber-500 to-orange-500"
          loading={isLoadingOverview && isLoadingStats}
        />
        <StatCard
          label="Events Processed"
          value={stats.eventsProcessed.toLocaleString()}
          sub="In the last 30 days"
          icon={Activity}
          accent="bg-gradient-to-r from-emerald-500 to-teal-500"
          loading={isLoadingOverview && isLoadingStats}
        />
        <StatCard
          label="Auto Replies"
          value={stats.autoReplies.toLocaleString()}
          sub="Replies sent by Loopin"
          icon={MessageSquare}
          accent="bg-gradient-to-r from-sky-500 to-blue-500"
          loading={isLoadingOverview && isLoadingStats}
        />
      </div>

      {/* ── Recent Interactions ──────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Recent Interactions</h2>
            <p className="text-xs text-slate-500 mt-0.5">Live feed of comment threads handled by Loopin</p>
          </div>
          {dashboardStats?.recentInteractions && dashboardStats.recentInteractions.length > 0 && (
            <Button asChild variant="ghost" size="sm" className="text-slate-400 hover:text-slate-200 text-xs gap-1">
              <Link href="/activity">
                View all
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          )}
        </div>

        {isLoadingStats ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : dashboardStats?.recentInteractions && dashboardStats.recentInteractions.length > 0 ? (
          <div className="space-y-3">
            {dashboardStats.recentInteractions.map((item) => (
              <InteractionRow key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed border-slate-800">
            <Activity className="h-10 w-10 mb-4 text-slate-700" />
            <p className="text-base font-medium text-slate-400">No interactions yet</p>
            <p className="text-sm text-slate-600 max-w-xs mt-1.5">
              Once your rules start firing you&apos;ll see a live feed of comment threads here.
            </p>
            {!isNewUser && (
              <Button asChild size="sm" variant="outline" className="mt-5 border-slate-700 text-slate-300 hover:bg-slate-800">
                <Link href="/automation/new">Create your first rule →</Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
