"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSequence, useSequenceEnrollments, useUpdateSequence } from "@/hooks/useSequence";
import { format } from "date-fns";
import {
  ArrowLeft, MessageSquare, AtSign, MessageCircle, GitBranch,
  Loader2, Clock, CheckCircle2, Circle, Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const TRIGGER_STYLES: Record<string, string> = {
  comment: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  mention: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  message: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const TRIGGER_LABELS: Record<string, string> = {
  comment: "Comment",
  mention: "Mention",
  message: "DM",
};

const TriggerIcon = ({ trigger }: { trigger: string }) => {
  if (trigger === "comment") return <MessageSquare className="h-3 w-3" />;
  if (trigger === "mention") return <AtSign className="h-3 w-3" />;
  return <MessageCircle className="h-3 w-3" />;
};

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  completed: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  stopped: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function SequenceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [enrollmentStatusFilter, setEnrollmentStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data: sequence, isLoading } = useSequence(id);
  const { data: enrollmentsData } = useSequenceEnrollments(id, {
    status: enrollmentStatusFilter || undefined,
    page,
    limit: 20,
  });
  const updateSequence = useUpdateSequence();

  const handleToggleActive = async () => {
    if (!sequence) return;
    try {
      await updateSequence.mutateAsync({ id, patch: { isActive: !sequence.isActive } });
      toast.success(sequence.isActive ? "Sequence paused" : "Sequence activated");
    } catch {
      toast.error("Failed to update sequence");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
      </div>
    );
  }

  if (!sequence) {
    return (
      <div className="text-center py-24">
        <p className="text-slate-400">Sequence not found</p>
        <Button variant="ghost" onClick={() => router.push("/sequences")} className="mt-4">
          Back to Sequences
        </Button>
      </div>
    );
  }

  const enrollments = enrollmentsData?.data ?? [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="mt-0.5 text-slate-400 hover:text-slate-200"
            onClick={() => router.push("/sequences")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">{sequence.name}</h1>
              <span className={cn("inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border font-medium", TRIGGER_STYLES[sequence.trigger])}>
                <TriggerIcon trigger={sequence.trigger} />
                {TRIGGER_LABELS[sequence.trigger]}
              </span>
              {!sequence.isActive && (
                <span className="text-xs px-2 py-1 rounded-md bg-slate-700/50 text-slate-400 border border-slate-700">Paused</span>
              )}
            </div>
            {sequence.description && (
              <p className="text-slate-400 text-sm mt-1">{sequence.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">{sequence.isActive ? "Active" : "Paused"}</span>
          <Switch
            checked={sequence.isActive}
            onCheckedChange={handleToggleActive}
            className="data-[state=checked]:bg-indigo-600"
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Active Enrollments", value: sequence.activeEnrollments ?? 0, color: "text-emerald-400" },
          { label: "Completed", value: sequence.completedEnrollments ?? 0, color: "text-slate-300" },
          { label: "Total Enrolled", value: sequence.totalEnrollments ?? 0, color: "text-indigo-400" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-slate-800 bg-slate-900 p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500/50 to-transparent" />
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{stat.label}</p>
            <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Steps timeline */}
        <div className="col-span-2 rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm font-semibold text-slate-100 mb-4">Sequence Steps</p>
          <div className="space-y-0">
            {sequence.steps.map((s, i) => (
              <div key={s.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="h-7 w-7 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                    {i === 0 ? (
                      <Circle className="h-3 w-3 text-indigo-400 fill-indigo-400" />
                    ) : (
                      <span className="text-xs font-bold text-indigo-400">{s.stepNumber}</span>
                    )}
                  </div>
                  {i < sequence.steps.length - 1 && (
                    <div className="w-px flex-1 bg-slate-800 my-1 min-h-4" />
                  )}
                </div>
                <div className={cn("pb-4", i === sequence.steps.length - 1 ? "" : "")}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-slate-300">
                      {s.delayDays === 0 ? "Immediately" : `Day ${s.delayDays}`}
                    </span>
                    <Clock className="h-3 w-3 text-slate-500" />
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{s.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Enrollments table */}
        <div className="col-span-3 rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-400" />
              <p className="text-sm font-semibold text-slate-100">Enrollments</p>
            </div>
            <Select value={enrollmentStatusFilter} onValueChange={(v) => { setEnrollmentStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="h-7 w-32 text-xs bg-slate-950 border-slate-700">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="stopped">Stopped</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {enrollments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <div className="h-10 w-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-3">
                <GitBranch className="h-5 w-5 text-slate-500" />
              </div>
              <p className="text-sm text-slate-400">No enrollments yet</p>
              <p className="text-xs text-slate-500 mt-1">Contacts will appear here when they trigger this sequence</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-slate-800">
                {enrollments.map((enrollment) => (
                  <div key={enrollment.id} className="flex items-center gap-4 px-5 py-3">
                    <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400 shrink-0">
                      {(enrollment.contact.displayName ?? enrollment.contact.username)[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">
                        {enrollment.contact.displayName ?? `@${enrollment.contact.username}`}
                      </p>
                      <p className="text-xs text-slate-500">@{enrollment.contact.username}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-slate-500">
                        Step {enrollment.currentStep}/{sequence.steps.length}
                      </span>
                      <span className={cn("text-xs px-2 py-0.5 rounded border", STATUS_STYLES[enrollment.status])}>
                        {enrollment.status}
                      </span>
                      {enrollment.status === "active" && (
                        <span className="text-xs text-slate-500">
                          Next: {format(new Date(enrollment.nextSendAt), "MMM d")}
                        </span>
                      )}
                      {enrollment.status === "completed" && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {enrollmentsData && enrollmentsData.totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800">
                  <span className="text-xs text-slate-500">
                    Page {enrollmentsData.page} of {enrollmentsData.totalPages}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      disabled={page <= 1}
                      onClick={() => setPage(p => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      disabled={page >= enrollmentsData.totalPages}
                      onClick={() => setPage(p => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
