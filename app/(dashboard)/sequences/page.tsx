"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useSequences, useDeleteSequence, useUpdateSequence, type Sequence } from "@/hooks/useSequence";
import api from "@/lib/api";
import { format } from "date-fns";
import { GitBranch, Plus, Trash2, Loader2, MessageSquare, AtSign, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { FeatureGate } from "@/components/ui/feature-gate";

interface Account {
  id: string;
  username: string;
}

const TRIGGER_STYLES: Record<string, string> = {
  comment: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  mention: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  message: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const TriggerIcon = ({ trigger }: { trigger: string }) => {
  if (trigger === "comment") return <MessageSquare className="h-3 w-3" />;
  if (trigger === "mention") return <AtSign className="h-3 w-3" />;
  return <MessageCircle className="h-3 w-3" />;
};

export default function SequencesPage() {
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

  const { data: sequences, isLoading } = useSequences(accountId);
  const deleteSequence = useDeleteSequence();
  const updateSequence = useUpdateSequence();

  const handleDelete = async (seq: Sequence, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete sequence "${seq.name}"? This will stop all active enrollments.`)) return;
    try {
      await deleteSequence.mutateAsync(seq.id);
      toast.success("Sequence deleted");
    } catch {
      toast.error("Failed to delete sequence");
    }
  };

  const handleToggleActive = async (seq: Sequence, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateSequence.mutateAsync({ id: seq.id, patch: { isActive: !seq.isActive } });
      toast.success(seq.isActive ? "Sequence paused" : "Sequence activated");
    } catch {
      toast.error("Failed to update sequence");
    }
  };

  return (
    <FeatureGate plan="pro" mode="page" label="Sequences">
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sequences</h1>
          <p className="text-slate-400">Automate multi-step DM campaigns triggered by keyword interactions</p>
        </div>
        <Button
          className="bg-indigo-600 hover:bg-indigo-500 text-white"
          onClick={() => router.push("/sequences/new")}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Sequence
        </Button>
      </div>

      {/* Account selector */}
      {accounts && accounts.length > 1 && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400">Account:</span>
          <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
            <SelectTrigger className="w-48 bg-slate-900 border-slate-800">
              <SelectValue placeholder="All accounts" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((acc) => (
                <SelectItem key={acc.id} value={acc.id}>@{acc.username}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
        </div>
      ) : !sequences || sequences.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 p-12 flex flex-col items-center text-center">
          <div className="h-14 w-14 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-4">
            <GitBranch className="h-7 w-7 text-indigo-400" />
          </div>
          <h3 className="text-base font-semibold text-slate-200 mb-1">No sequences yet</h3>
          <p className="text-sm text-slate-500 max-w-sm mb-6">
            Create multi-step DM campaigns that automatically enroll contacts when they interact with your posts.
          </p>
          <Button
            className="bg-indigo-600 hover:bg-indigo-500 text-white"
            onClick={() => router.push("/sequences/new")}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create First Sequence
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
          <div className="relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-5 py-3">Name</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-5 py-3">Trigger</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-5 py-3">Steps</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-5 py-3">Enrollments</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-5 py-3">Created</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-5 py-3">Active</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {sequences.map((seq) => (
                <tr
                  key={seq.id}
                  className="border-b border-slate-800 last:border-0 hover:bg-slate-800/50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/sequences/${seq.id}`)}
                >
                  <td className="px-5 py-4">
                    <p className="font-medium text-sm text-slate-200">{seq.name}</p>
                    {seq.description && (
                      <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">{seq.description}</p>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className={cn("inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border font-medium", TRIGGER_STYLES[seq.trigger])}>
                      <TriggerIcon trigger={seq.trigger} />
                      {seq.trigger.charAt(0).toUpperCase() + seq.trigger.slice(1)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-slate-300">{seq.steps.length} step{seq.steps.length !== 1 ? "s" : ""}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="text-emerald-400 font-medium">{seq.activeEnrollments ?? 0} active</span>
                      <span>{seq.completedEnrollments ?? 0} done</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-slate-400">{format(new Date(seq.createdAt), "MMM d, yyyy")}</span>
                  </td>
                  <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                    <Switch
                      checked={seq.isActive}
                      onCheckedChange={() => {}}
                      onClick={(e) => handleToggleActive(seq, e)}
                      className="data-[state=checked]:bg-indigo-600"
                    />
                  </td>
                  <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-500 hover:text-red-400 hover:bg-red-400/10"
                      onClick={(e) => handleDelete(seq, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
    </FeatureGate>
  );
}
