"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useBroadcast, useBroadcastRecipients, useSendBroadcast } from "@/hooks/useBroadcast";
import { formatDistanceToNow, parseISO, format } from "date-fns";
import { ChevronLeft, ChevronRight, Loader2, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  running: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  failed: "bg-red-500/10 text-red-400 border-red-500/20",
};

const RECIPIENT_STATUS_STYLES: Record<string, string> = {
  pending: "bg-slate-500/10 text-slate-400",
  sent: "bg-emerald-500/10 text-emerald-400",
  failed: "bg-red-500/10 text-red-400",
};

export default function BroadcastDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [page, setPage] = useState(1);

  const { data: broadcast, isLoading } = useBroadcast(id);
  const { data: recipientsData } = useBroadcastRecipients(id, { page, limit: 20 });
  const sendBroadcast = useSendBroadcast();

  const handleSend = async () => {
    if (!broadcast) return;
    try {
      await sendBroadcast.mutateAsync(broadcast.id);
      toast.success("Broadcast launched!");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error?.response?.data?.error ?? "Failed to send broadcast");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!broadcast) {
    return (
      <div className="space-y-4">
        <Link href="/broadcasts" className="text-sm text-slate-400 hover:text-slate-100">
          ← Back to Broadcasts
        </Link>
        <p className="text-slate-500">Broadcast not found.</p>
      </div>
    );
  }

  const progress =
    broadcast.totalRecipients > 0
      ? Math.round(((broadcast.sentCount + broadcast.failedCount) / broadcast.totalRecipients) * 100)
      : 0;

  const pendingCount =
    broadcast.totalRecipients - broadcast.sentCount - broadcast.failedCount;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Link href="/broadcasts" className="text-sm text-slate-400 hover:text-slate-100">
            ← Back to Broadcasts
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{broadcast.name}</h1>
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                STATUS_STYLES[broadcast.status] ?? STATUS_STYLES.draft
              )}
            >
              {broadcast.status}
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Created {formatDistanceToNow(parseISO(broadcast.createdAt), { addSuffix: true })}
            {broadcast.completedAt && (
              <> · Completed {format(parseISO(broadcast.completedAt), "MMM d, yyyy 'at' h:mm a")}</>
            )}
          </p>
        </div>

        {broadcast.status === "draft" && (
          <Button
            className="bg-indigo-600 hover:bg-indigo-700 gap-2"
            onClick={handleSend}
            disabled={sendBroadcast.isPending}
          >
            {sendBroadcast.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Send Broadcast
          </Button>
        )}
      </div>

      {/* Stats */}
      {broadcast.totalRecipients > 0 && (
        <div className="space-y-3">
          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm text-slate-400">
              <span>
                {broadcast.sentCount + broadcast.failedCount} / {broadcast.totalRecipients} processed
              </span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-800">
              <div
                className="h-2 rounded-full bg-indigo-600 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-emerald-400">{broadcast.sentCount}</p>
                <p className="text-sm text-slate-400">Sent</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-red-400">{broadcast.failedCount}</p>
                <p className="text-sm text-slate-400">Failed</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-slate-300">{pendingCount}</p>
                <p className="text-sm text-slate-400">Pending</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Message preview */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-sm text-slate-400">Message</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-200 font-mono whitespace-pre-wrap">{broadcast.message}</p>
          {broadcast.tagFilter.length > 0 && (
            <div className="mt-3 flex gap-2 flex-wrap">
              <span className="text-xs text-slate-500">Tag filter:</span>
              {broadcast.tagFilter.map((tag) => (
                <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recipients table */}
      {recipientsData && recipientsData.data.length > 0 && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-base">
              Recipients{" "}
              <span className="text-slate-500 font-normal text-sm">({recipientsData.total})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-[2fr_1fr_1fr] gap-4 px-6 py-3 text-xs uppercase text-slate-500 border-b border-slate-800">
              <span>Contact</span>
              <span>Status</span>
              <span>Sent at / Error</span>
            </div>
            <div className="divide-y divide-slate-800">
              {recipientsData.data.map((r) => (
                <div
                  key={r.id}
                  className="grid grid-cols-[2fr_1fr_1fr] gap-4 px-6 py-3 items-center"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {r.contact.profilePictureUrl ? (
                      <img
                        src={r.contact.profilePictureUrl}
                        alt=""
                        className="h-7 w-7 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="h-7 w-7 rounded-full bg-slate-700 shrink-0 flex items-center justify-center text-xs text-slate-400">
                        {r.contact.username[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm text-slate-100 truncate">
                        {r.contact.displayName ?? `@${r.contact.username}`}
                      </p>
                      {r.contact.displayName && (
                        <p className="text-xs text-slate-500 truncate">@{r.contact.username}</p>
                      )}
                    </div>
                  </div>

                  <span
                    className={cn(
                      "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium w-fit",
                      RECIPIENT_STATUS_STYLES[r.status] ?? RECIPIENT_STATUS_STYLES.pending
                    )}
                  >
                    {r.status}
                  </span>

                  <span className="text-xs truncate">
                    {r.sentAt ? (
                      <span className="text-slate-400">{format(parseISO(r.sentAt), "MMM d, h:mm a")}</span>
                    ) : r.error ? (
                      <span className="text-red-400">{r.error}</span>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </span>
                </div>
              ))}
            </div>

            {recipientsData.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800">
                <span className="text-sm text-slate-500">
                  Page {recipientsData.page} of {recipientsData.totalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-slate-700 h-8 w-8"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-slate-700 h-8 w-8"
                    disabled={page >= recipientsData.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
