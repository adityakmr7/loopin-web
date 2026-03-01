"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBroadcasts, useDeleteBroadcast, useCancelScheduledBroadcast, type Broadcast } from "@/hooks/useBroadcast";
import api from "@/lib/api";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { Radio, Plus, Trash2, Loader2, Clock, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Account {
  id: string;
  username: string;
}

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  scheduled: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  running: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  failed: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function BroadcastsPage() {
  const router = useRouter();
  const [selectedAccountId, setSelectedAccountId] = useState("");

  const { data: accounts } = useQuery<Account[]>({
    queryKey: ["instagram", "accounts"],
    queryFn: async () => {
      const { data } = await api.get("/instagram/accounts");
      return data.data || [];
    },
  });

  const accountId = selectedAccountId || accounts?.[0]?.id;

  const { data: broadcasts, isLoading } = useBroadcasts(accountId);
  const deleteBroadcast = useDeleteBroadcast();
  const cancelSchedule = useCancelScheduledBroadcast();

  const handleDelete = async (b: Broadcast, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete broadcast "${b.name}"?`)) return;
    try {
      await deleteBroadcast.mutateAsync(b.id);
      toast.success("Broadcast deleted");
    } catch {
      toast.error("Failed to delete broadcast");
    }
  };

  const handleCancelSchedule = async (b: Broadcast, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Cancel scheduled broadcast "${b.name}"? It will revert to draft.`)) return;
    try {
      await cancelSchedule.mutateAsync(b.id);
      toast.success("Scheduled broadcast cancelled");
    } catch {
      toast.error("Failed to cancel scheduled broadcast");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Broadcasts</h1>
          <p className="text-slate-400">Send a DM to all (or filtered) contacts at once</p>
        </div>
        <Button
          className="bg-indigo-600 hover:bg-indigo-700 gap-2"
          onClick={() => router.push("/broadcasts/new")}
        >
          <Plus className="h-4 w-4" />
          New Broadcast
        </Button>
      </div>

      {accounts && accounts.length > 1 && (
        <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
          <SelectTrigger className="w-48 bg-slate-900 border-slate-800">
            <SelectValue placeholder="Select account" />
          </SelectTrigger>
          <SelectContent>
            {accounts.map((acc) => (
              <SelectItem key={acc.id} value={acc.id}>
                @{acc.username}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          ) : !accountId ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500">
              <Radio className="h-10 w-10 mb-4 opacity-20" />
              <p className="text-lg font-medium text-slate-400">No account connected</p>
              <p className="text-sm mt-2">Connect an Instagram account first</p>
            </div>
          ) : !broadcasts || broadcasts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500">
              <Radio className="h-10 w-10 mb-4 opacity-20" />
              <p className="text-lg font-medium text-slate-400">No broadcasts yet</p>
              <p className="text-sm mt-2">Create your first broadcast to reach all your contacts</p>
              <Button
                className="mt-4 bg-indigo-600 hover:bg-indigo-700 gap-2"
                onClick={() => router.push("/broadcasts/new")}
              >
                <Plus className="h-4 w-4" />
                New Broadcast
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3 text-xs uppercase text-slate-500 border-b border-slate-800">
                <span>Name</span>
                <span>Status</span>
                <span>Progress / Scheduled</span>
                <span>Created</span>
                <span />
              </div>
              <div className="divide-y divide-slate-800">
                {broadcasts.map((b) => (
                  <div
                    key={b.id}
                    className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4 items-center hover:bg-slate-800/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/broadcasts/${b.id}`)}
                  >
                    <span className="text-sm font-medium text-slate-100 truncate">{b.name}</span>

                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium w-fit",
                        STATUS_STYLES[b.status] ?? STATUS_STYLES.draft
                      )}
                    >
                      {b.status === "scheduled" && <Clock className="h-3 w-3" />}
                      {b.status}
                    </span>

                    <span className="text-sm text-slate-400">
                      {b.status === "scheduled" && b.scheduledAt ? (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-indigo-400" />
                          {format(parseISO(b.scheduledAt), "MMM d, h:mm a")}
                        </span>
                      ) : b.totalRecipients > 0 ? (
                        `${b.sentCount} / ${b.totalRecipients}`
                      ) : (
                        "—"
                      )}
                    </span>

                    <span className="text-sm text-slate-400">
                      {formatDistanceToNow(parseISO(b.createdAt), { addSuffix: true })}
                    </span>

                    {b.status === "draft" ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-500 hover:text-red-400 hover:bg-red-400/10"
                        onClick={(e) => handleDelete(b, e)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : b.status === "scheduled" ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-500 hover:text-amber-400 hover:bg-amber-400/10"
                        title="Cancel schedule"
                        onClick={(e) => handleCancelSchedule(b, e)}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    ) : (
                      <div className="w-9" />
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
