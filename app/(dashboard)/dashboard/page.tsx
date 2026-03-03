"use client";

import { useAuth } from "@/hooks/use-auth";
import { Instagram, MessageSquare, Zap, CheckCircle2, Circle, ArrowRight, Plus, Users, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  return name ? `${greeting}, ${name.split(" ")[0]} 👋` : greeting;
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({
  label, value, sub, icon: Icon, accent, loading,
}: {
  label: string; value: string | number; sub: string;
  icon: React.ElementType; accent: string; loading?: boolean;
}) {
  return (
    <div className="relative rounded-xl border border-slate-800 bg-slate-900 p-5 overflow-hidden hover:border-slate-700 transition-colors">
      <div className={cn("absolute top-0 left-0 right-0 h-0.5", accent)} />
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
        <div className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center">
          <Icon className="h-4 w-4 text-slate-400" />
        </div>
      </div>
      {loading ? (
        <div className="space-y-2">
          <div className="h-7 w-16 rounded bg-slate-800 animate-pulse" />
          <div className="h-3 w-24 rounded bg-slate-800 animate-pulse" />
        </div>
      ) : (
        <>
          <p className="text-2xl font-bold text-slate-50 tabular-nums">{value}</p>
          <p className="text-xs text-slate-500 mt-1">{sub}</p>
        </>
      )}
    </div>
  );
}

// ── Onboarding checklist ───────────────────────────────────────────────────────
function OnboardingChecklist({
  hasAccount, hasRule,
}: { hasAccount: boolean; hasRule: boolean }) {
  const steps = [
    { label: "Create your account", done: true,       href: null },
    { label: "Connect Instagram",   done: hasAccount,  href: "/onboarding" },
    { label: "Create your first automation", done: hasRule, href: "/automation/new" },
  ];

  const completed = steps.filter((s) => s.done).length;
  const pct = Math.round((completed / steps.length) * 100);

  if (completed === steps.length) return null;

  return (
    <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-slate-100">Get started</h3>
          <p className="text-xs text-slate-400 mt-0.5">{completed} of {steps.length} steps complete</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-24 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs font-medium text-indigo-400">{pct}%</span>
        </div>
      </div>
      <div className="space-y-2.5">
        {steps.map((step) => (
          <div key={step.label} className="flex items-center gap-3">
            {step.done
              ? <CheckCircle2 className="h-4.5 w-4.5 text-indigo-400 shrink-0" />
              : <Circle className="h-4.5 w-4.5 text-slate-600 shrink-0" />}
            {step.done || !step.href ? (
              <span className={cn("text-sm", step.done ? "text-slate-400 line-through" : "text-slate-300")}>
                {step.label}
              </span>
            ) : (
              <Link href={step.href} className="text-sm text-slate-100 hover:text-indigo-400 transition-colors flex items-center gap-1 group">
                {step.label}
                <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Recent interaction row ─────────────────────────────────────────────────────
function InteractionRow({ item }: { item: Interaction }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl border border-slate-800 bg-slate-900/50 hover:border-slate-700 transition-colors">
      <div className="shrink-0 h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
        {item.commenter.username.slice(0, 2).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-indigo-400">@{item.commenter.username}</span>
          <span className="text-xs text-slate-600">
            {formatDistanceToNow(parseISO(item.comment.timestamp), { addSuffix: true })}
          </span>
          {item.dmSent && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/40 border border-emerald-700/40 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
              DM sent
            </span>
          )}
        </div>
        <p className="text-sm text-slate-300 mt-1 truncate">{item.comment.text}</p>
        {item.reply.sent && item.reply.text && (
          <p className="text-xs text-slate-500 mt-1 truncate">
            <span className="text-indigo-400">Loopin replied:</span> {item.reply.text}
          </p>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Handle legacy ?error= param (OAuth errors still redirect here)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    if (error) {
      toast.error("Connection failed", { description: decodeURIComponent(error) });
      router.replace("/dashboard");
    }
  }, [router]);

  const { data: accounts, isLoading: accountsLoading } = useQuery({
    queryKey: ["instagram", "accounts"],
    queryFn: async () => {
      const { data } = await api.get("/instagram/accounts");
      return data.data || [];
    },
  });

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ["dashboard", "overview"],
    queryFn: async () => {
      const { data } = await api.get("/dashboard/overview");
      return data.data;
    },
  });

  const connectedAccount = overview?.accounts?.[0] || accounts?.[0];
  const { data: dashboardStats, isLoading: statsLoading } = useDashboardStats(connectedAccount?.id);

  const hasAccount = !accountsLoading && accounts && accounts.length > 0;
  const activeRules = dashboardStats?.activeRules ?? overview?.totalActiveRules ?? 0;
  const hasRule = activeRules > 0;
  const dmsSent = dashboardStats?.autoReplies?.total ?? overview?.totalAutoReplies ?? 0;
  const contacts = dashboardStats?.eventsProcessed?.total ?? overview?.totalEventsProcessed ?? 0;
  const statsLoaded = !overviewLoading && !statsLoading;

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{getGreeting(user?.name)}</h1>
          <p className="text-slate-400 mt-1 text-sm">
            {hasAccount
              ? "Here's how your automations are performing."
              : "Let's get your Instagram connected and automations running."}
          </p>
        </div>
        {hasAccount && (
          <Button asChild className="bg-indigo-600 hover:bg-indigo-500 text-white shrink-0 gap-2">
            <Link href="/automation/new">
              <Plus className="h-4 w-4" />
              New Automation
            </Link>
          </Button>
        )}
      </div>

      {/* Onboarding checklist — disappears once complete */}
      {!accountsLoading && !overviewLoading && (
        <OnboardingChecklist hasAccount={!!hasAccount} hasRule={hasRule} />
      )}

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Connected account card */}
        <div className="relative rounded-xl border border-slate-800 bg-slate-900 p-5 overflow-hidden hover:border-slate-700 transition-colors">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500" />
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Instagram</p>
            <div className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center">
              <Instagram className="h-4 w-4 text-slate-400" />
            </div>
          </div>
          {accountsLoading ? (
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
              <p className="text-sm text-slate-400 mb-3">No account connected</p>
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-7 gap-1.5" asChild>
                <Link href="/onboarding">
                  <Instagram className="h-3 w-3" />
                  Connect
                </Link>
              </Button>
            </>
          )}
        </div>

        <StatCard
          label="Active Automations"
          value={statsLoaded ? activeRules : "—"}
          sub="Rules currently live"
          icon={Zap}
          accent="bg-gradient-to-r from-amber-500 to-orange-500"
          loading={!statsLoaded}
        />
        <StatCard
          label="DMs Sent"
          value={statsLoaded ? dmsSent.toLocaleString() : "—"}
          sub="Automated DMs this month"
          icon={MessageSquare}
          accent="bg-gradient-to-r from-emerald-500 to-teal-500"
          loading={!statsLoaded}
        />
      </div>

      {/* Recent automation activity */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-100">Recent Activity</h2>
            <p className="text-xs text-slate-500 mt-0.5">Latest comments handled by your automations</p>
          </div>
        </div>

        {statsLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
          </div>
        ) : dashboardStats?.recentInteractions && dashboardStats.recentInteractions.length > 0 ? (
          <div className="space-y-2.5">
            {dashboardStats.recentInteractions.map((item) => (
              <InteractionRow key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed border-slate-800">
            <div className="h-14 w-14 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-4">
              <Zap className="h-7 w-7 text-indigo-400" />
            </div>
            <p className="text-base font-semibold text-slate-200 mb-1">No activity yet</p>
            <p className="text-sm text-slate-500 max-w-xs mb-6">
              Once your automation fires for the first time, you&apos;ll see every interaction here.
            </p>
            {hasAccount && (
              <Button asChild className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2">
                <Link href="/automation/new">
                  <Plus className="h-4 w-4" />
                  Create your first automation
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
