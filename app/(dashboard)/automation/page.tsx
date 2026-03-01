"use client";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Zap, MessageSquare, AtSign, Trash2, Edit, Mail, ImageIcon, MessageCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AutomationRule {
  id: string;
  name: string;
  description: string | null;
  trigger: "comment" | "mention" | "message";
  postFilter: string[];
  isActive: boolean;
  triggerCount: number;
  dmCount?: number;
  lastTriggered: string | null;
  createdAt: string;
  account: {
    username: string;
  };
}

const TRIGGER_CONFIG = {
  comment: { icon: MessageSquare, color: "text-blue-400", bg: "bg-blue-500/10", label: "Comment" },
  mention: { icon: AtSign, color: "text-orange-400", bg: "bg-orange-500/10", label: "Mention" },
  message: { icon: MessageCircle, color: "text-emerald-400", bg: "bg-emerald-500/10", label: "DM" },
} as const;

export default function AutomationPage() {
  const queryClient = useQueryClient();

  const { data: rules, isLoading } = useQuery<AutomationRule[]>({
    queryKey: ["automation", "rules"],
    queryFn: async () => {
      const { data } = await api.get("/automation/rules");
      return data.data;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await api.patch(`/automation/rules/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation", "rules"] });
      toast.success("Rule status updated");
    },
    onError: () => toast.error("Failed to update rule"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/automation/rules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation", "rules"] });
      toast.success("Rule deleted");
    },
    onError: () => toast.error("Failed to delete rule"),
  });

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Automation Rules</h1>
          <p className="text-slate-400 mt-1">Design your auto-reply workflows</p>
        </div>
        <Button asChild className="bg-indigo-600 hover:bg-indigo-500 text-white shrink-0">
          <Link href="/automation/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Rule
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : rules && rules.length > 0 ? (
        <div className="space-y-3">
          {rules.map((rule) => {
            const trigger = TRIGGER_CONFIG[rule.trigger] ?? TRIGGER_CONFIG.comment;
            const TriggerIcon = trigger.icon;
            return (
              <div
                key={rule.id}
                className={cn(
                  "rounded-xl border bg-slate-900 p-5 transition-colors hover:border-slate-700",
                  rule.isActive ? "border-slate-800" : "border-slate-800/50 opacity-70"
                )}
              >
                <div className="flex items-start gap-4">
                  {/* Trigger icon */}
                  <div className={cn("p-2 rounded-lg shrink-0 mt-0.5", trigger.bg)}>
                    <TriggerIcon className={cn("h-4 w-4", trigger.color)} />
                  </div>

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-100">{rule.name}</h3>
                      <span className="text-[11px] px-2 py-0.5 rounded-full border border-slate-700 text-slate-500">
                        @{rule.account.username}
                      </span>
                      <span className={cn(
                        "text-[11px] px-2 py-0.5 rounded-full border font-medium",
                        trigger.color,
                        trigger.bg,
                        "border-transparent"
                      )}>
                        {trigger.label}
                      </span>
                      {rule.trigger === "comment" && (
                        <span className={cn(
                          "text-[11px] px-2 py-0.5 rounded-full border flex items-center gap-1",
                          rule.postFilter?.length > 0
                            ? "border-sky-700/50 text-sky-400 bg-sky-500/5"
                            : "border-slate-700 text-slate-500"
                        )}>
                          <ImageIcon className="h-2.5 w-2.5" />
                          {rule.postFilter?.length > 0
                            ? `${rule.postFilter.length} post${rule.postFilter.length > 1 ? "s" : ""}`
                            : "All posts"}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mt-1">{rule.description || "No description"}</p>

                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-600">
                      <span className="flex items-center gap-1">
                        <Zap className="h-3 w-3 text-amber-500" />
                        {rule.triggerCount} runs
                      </span>
                      {rule.dmCount != null && rule.dmCount > 0 && (
                        <span className="flex items-center gap-1 text-emerald-500">
                          <Mail className="h-3 w-3" />
                          {rule.dmCount} DMs sent
                        </span>
                      )}
                      <span>
                        {rule.lastTriggered
                          ? `Last run ${formatDistanceToNow(new Date(rule.lastTriggered))} ago`
                          : "Never run"}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={rule.isActive}
                      onCheckedChange={(checked) =>
                        toggleMutation.mutate({ id: rule.id, isActive: checked })
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-500 hover:text-slate-200 hover:bg-slate-800"
                      asChild
                    >
                      <Link href={`/automation/${rule.id}/edit`}>
                        <Edit className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-500 hover:text-red-400 hover:bg-red-400/10"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this rule?")) {
                          deleteMutation.mutate(rule.id);
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border border-dashed border-slate-800">
          <div className="h-14 w-14 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-4">
            <Zap className="h-7 w-7 text-indigo-400" />
          </div>
          <h3 className="text-base font-semibold text-slate-200 mb-1">No automation rules yet</h3>
          <p className="text-sm text-slate-500 max-w-sm mb-6">
            Create your first rule to automatically reply to comments that contain specific keywords.
          </p>
          <Button asChild className="bg-indigo-600 hover:bg-indigo-500 text-white">
            <Link href="/automation/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Rule
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
