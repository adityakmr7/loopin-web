"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useActivity, type ActivityLog } from "@/hooks/useActivity";
import api from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ChevronRight, CheckCircle2, XCircle, MinusCircle, MessageSquare, AtSign, MessageCircle, Reply, Send, EyeOff, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface Account {
  id: string;
  username: string;
}

const TRIGGER_OPTIONS = [
  { value: "all", label: "All triggers" },
  { value: "comment", label: "Comment" },
  { value: "mention", label: "Mention" },
  { value: "message", label: "DM" },
];

const ACTION_OPTIONS = [
  { value: "all", label: "All actions" },
  { value: "reply", label: "Reply to Comment" },
  { value: "comment_to_dm", label: "Comment → DM" },
  { value: "reply_dm", label: "DM Reply" },
  { value: "hide", label: "Hide Comment" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "success", label: "Success" },
  { value: "failed", label: "Failed" },
  { value: "skipped", label: "Skipped" },
];

function StatusBadge({ status }: { status: ActivityLog["status"] }) {
  if (status === "success") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
        <CheckCircle2 className="h-3.5 w-3.5" /> Success
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-400">
        <XCircle className="h-3.5 w-3.5" /> Failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400">
      <MinusCircle className="h-3.5 w-3.5" /> Skipped
    </span>
  );
}

function TriggerBadge({ trigger }: { trigger: ActivityLog["trigger"] }) {
  if (trigger === "comment") return <Badge variant="outline" className="text-indigo-400 border-indigo-500/30 gap-1 text-xs"><MessageSquare className="h-3 w-3" />Comment</Badge>;
  if (trigger === "mention") return <Badge variant="outline" className="text-purple-400 border-purple-500/30 gap-1 text-xs"><AtSign className="h-3 w-3" />Mention</Badge>;
  return <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 gap-1 text-xs"><MessageCircle className="h-3 w-3" />DM</Badge>;
}

function ActionLabel({ action }: { action: ActivityLog["action"] }) {
  const map: Record<string, { label: string; icon: React.ElementType }> = {
    reply: { label: "Reply to comment", icon: Reply },
    comment_to_dm: { label: "Comment → DM", icon: Send },
    reply_dm: { label: "DM reply", icon: Send },
    hide: { label: "Hide comment", icon: EyeOff },
  };
  const { label, icon: Icon } = map[action] ?? { label: action, icon: Zap };
  return (
    <span className="inline-flex items-center gap-1 text-sm text-slate-300">
      <Icon className="h-3.5 w-3.5 text-slate-500" />
      {label}
    </span>
  );
}

export default function ActivityPage() {
  const [accountId, setAccountId] = useState("all");
  const [trigger, setTrigger] = useState("all");
  const [action, setAction] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  const { data: accounts } = useQuery<Account[]>({
    queryKey: ["instagram", "accounts"],
    queryFn: async () => {
      const { data } = await api.get("/instagram/accounts");
      return data.data || [];
    },
  });

  const { data, isLoading } = useActivity({
    accountId: accountId === "all" ? undefined : accountId,
    trigger: trigger === "all" ? undefined : trigger,
    action: action === "all" ? undefined : action,
    status: status === "all" ? undefined : status,
    page,
    limit: 50,
  });

  const resetPage = () => setPage(1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Activity Log</h1>
        <p className="text-slate-400 mt-1">Every automation action Loopin has taken on your behalf.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select
          value={accountId}
          onValueChange={(v) => { setAccountId(v); resetPage(); }}
        >
          <SelectTrigger className="bg-slate-900 border-slate-800 w-48">
            <SelectValue placeholder="All accounts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All accounts</SelectItem>
            {accounts?.map((acc) => (
              <SelectItem key={acc.id} value={acc.id}>@{acc.username}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={trigger} onValueChange={(v) => { setTrigger(v); resetPage(); }}>
          <SelectTrigger className="bg-slate-900 border-slate-800 w-40">
            <SelectValue placeholder="All triggers" />
          </SelectTrigger>
          <SelectContent>
            {TRIGGER_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={action} onValueChange={(v) => { setAction(v); resetPage(); }}>
          <SelectTrigger className="bg-slate-900 border-slate-800 w-44">
            <SelectValue placeholder="All actions" />
          </SelectTrigger>
          <SelectContent>
            {ACTION_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={(v) => { setStatus(v); resetPage(); }}>
          <SelectTrigger className="bg-slate-900 border-slate-800 w-36">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(accountId !== "all" || trigger !== "all" || action !== "all" || status !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setAccountId("all"); setTrigger("all"); setAction("all"); setStatus("all"); resetPage(); }}
            className="text-slate-400 hover:text-slate-200"
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 border-b border-slate-800">
            <tr>
              <th className="text-left px-4 py-3 text-xs uppercase text-slate-500 font-medium">Time</th>
              <th className="text-left px-4 py-3 text-xs uppercase text-slate-500 font-medium">Trigger</th>
              <th className="text-left px-4 py-3 text-xs uppercase text-slate-500 font-medium">Action</th>
              <th className="text-left px-4 py-3 text-xs uppercase text-slate-500 font-medium">Rule</th>
              <th className="text-left px-4 py-3 text-xs uppercase text-slate-500 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-xs uppercase text-slate-500 font-medium">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="text-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-500 mx-auto" />
                </td>
              </tr>
            ) : !data?.logs.length ? (
              <tr>
                <td colSpan={6} className="text-center py-16 text-slate-500">
                  <Zap className="h-8 w-8 mx-auto mb-3 opacity-30" />
                  <p>No activity yet.</p>
                  <p className="text-xs mt-1">Activity appears here once automations start firing.</p>
                </td>
              </tr>
            ) : (
              data.logs.map((log) => (
                <tr key={log.id} className={cn("hover:bg-slate-900/50 transition-colors", log.status === "failed" && "bg-red-950/10")}>
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                    {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                  </td>
                  <td className="px-4 py-3">
                    <TriggerBadge trigger={log.trigger} />
                  </td>
                  <td className="px-4 py-3">
                    <ActionLabel action={log.action} />
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {log.ruleName ?? <span className="text-slate-600 italic">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={log.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-400 max-w-xs truncate" title={log.detail ?? undefined}>
                    {log.detail ?? <span className="text-slate-600">—</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">
            {data.total} total entries · Page {data.page} of {data.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="border-slate-700"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
              disabled={page === data.totalPages}
              className="border-slate-700"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
