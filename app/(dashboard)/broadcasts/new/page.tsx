"use client";

import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateBroadcast, useSendBroadcast, useEstimatedAudience } from "@/hooks/useBroadcast";
import api from "@/lib/api";
import { Info, Send, Clock, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Account {
  id: string;
  username: string;
}

const TEMPLATE_VARS = ["{{username}}", "{{name}}", "{{account}}"];

// Build a datetime-local string for the min attribute (now + 5 min)
function getMinDateTime() {
  const d = new Date(Date.now() + 5 * 60 * 1000);
  return d.toISOString().slice(0, 16);
}

export default function NewBroadcastPage() {
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: accounts } = useQuery<Account[]>({
    queryKey: ["instagram", "accounts"],
    queryFn: async () => {
      const { data } = await api.get("/instagram/accounts");
      return data.data || [];
    },
  });

  const accountId = selectedAccountId || accounts?.[0]?.id || "";

  const { data: estimatedCount } = useEstimatedAudience(accountId || undefined, tagFilter);

  const createBroadcast = useCreateBroadcast();
  const sendBroadcast = useSendBroadcast();

  const insertVariable = (variable: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newMessage = message.slice(0, start) + variable + message.slice(end);
    setMessage(newMessage);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
  };

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !tagFilter.includes(trimmed)) {
      setTagFilter([...tagFilter, trimmed]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setTagFilter(tagFilter.filter((t) => t !== tag));
  };

  const handleSend = async () => {
    if (!accountId || !name.trim() || !message.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (scheduleEnabled && !scheduledAt) {
      toast.error("Please select a date and time to schedule the broadcast");
      return;
    }

    if (scheduleEnabled && new Date(scheduledAt) <= new Date()) {
      toast.error("Scheduled time must be in the future");
      return;
    }

    try {
      const { broadcast } = await createBroadcast.mutateAsync({
        accountId,
        name: name.trim(),
        message: message.trim(),
        tagFilter,
      });

      await sendBroadcast.mutateAsync({
        broadcastId: broadcast.id,
        scheduledAt: scheduleEnabled ? new Date(scheduledAt).toISOString() : undefined,
      });

      toast.success(scheduleEnabled ? "Broadcast scheduled!" : "Broadcast launched!");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error?.response?.data?.error ?? "Failed to send broadcast");
    }
  };

  const isSubmitting = createBroadcast.isPending || sendBroadcast.isPending;

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Broadcast</h1>
        <p className="text-slate-400">Send a DM to multiple contacts at once</p>
      </div>

      {/* API notice */}
      <div className="flex gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-300">
        <Info className="h-4 w-4 shrink-0 mt-0.5" />
        <span>
          Only reaches contacts who have previously interacted with your account (comment, mention, or DM).
          Instagram rate limit: <strong>200 DMs/hour</strong> per account.
        </span>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900">
        <div className="px-6 py-4 border-b border-slate-800">
          <p className="text-base font-semibold text-slate-100">Broadcast details</p>
        </div>
        <div className="p-6 space-y-6">
          {/* Account selector */}
          {accounts && accounts.length > 1 && (
            <div className="space-y-2">
              <Label>Account</Label>
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger className="bg-slate-950 border-slate-700">
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
            </div>
          )}

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Broadcast name</Label>
            <Input
              id="name"
              placeholder="e.g. Summer sale announcement"
              className="bg-slate-950 border-slate-700"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <div className="flex gap-2 flex-wrap mb-2">
              {TEMPLATE_VARS.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => insertVariable(v)}
                  className="text-xs px-2 py-1 rounded bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 transition-colors font-mono"
                >
                  {v}
                </button>
              ))}
            </div>
            <Textarea
              id="message"
              ref={textareaRef}
              placeholder="Hey {{username}}, thanks for interacting with us! ..."
              className="bg-slate-950 border-slate-700 min-h-32 font-mono text-sm"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <p className="text-xs text-slate-500">
              Click a variable to insert it at the cursor position.
            </p>
          </div>

          {/* Tag filter */}
          <div className="space-y-2">
            <Label>Tag filter (optional)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag..."
                className="bg-slate-950 border-slate-700"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addTag(tagInput);
                  }
                }}
              />
              <Button
                variant="outline"
                className="border-slate-700"
                onClick={() => addTag(tagInput)}
                disabled={!tagInput.trim()}
              >
                Add
              </Button>
            </div>
            {tagFilter.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-2">
                {tagFilter.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-slate-700 text-slate-300"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-slate-500 hover:text-red-400 ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <p className="text-xs text-slate-500">
              {tagFilter.length === 0
                ? "No filter applied — all contacts will receive this broadcast."
                : "Only contacts with any of these tags will receive this broadcast."}
            </p>
          </div>

          {/* Audience preview */}
          {accountId && (
            <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm">
              <Users className="h-4 w-4 text-indigo-400" />
              <span className="text-slate-300">
                {estimatedCount === undefined ? (
                  <span className="text-slate-500">Calculating audience…</span>
                ) : (
                  <>
                    <strong className="text-indigo-400">{estimatedCount}</strong> contact
                    {estimatedCount !== 1 ? "s" : ""} will receive this broadcast
                  </>
                )}
              </span>
            </div>
          )}

          {/* Schedule toggle */}
          <div className="rounded-lg border border-slate-800 bg-slate-950 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400" />
                <div>
                  <Label className="text-sm font-medium">Schedule for later</Label>
                  <p className="text-xs text-slate-500 mt-0.5">Send at a specific date and time instead of now.</p>
                </div>
              </div>
              <Switch
                checked={scheduleEnabled}
                onCheckedChange={(c) => {
                  setScheduleEnabled(c);
                  if (!c) setScheduledAt("");
                }}
                className="data-[state=checked]:bg-indigo-600"
              />
            </div>
            {scheduleEnabled && (
              <div className="px-4 pb-4 border-t border-slate-800 pt-3">
                <Input
                  type="datetime-local"
                  className="bg-slate-900 border-slate-700 text-slate-100"
                  value={scheduledAt}
                  min={getMinDateTime()}
                  onChange={(e) => setScheduledAt(e.target.value)}
                />
                <p className="text-xs text-slate-500 mt-1.5">
                  Times are in your local timezone. The broadcast will start automatically at the selected time.
                </p>
              </div>
            )}
          </div>

          <Button
            className="w-full bg-indigo-600 hover:bg-indigo-500 gap-2"
            onClick={handleSend}
            disabled={isSubmitting || !accountId || !name.trim() || !message.trim()}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : scheduleEnabled ? (
              <Clock className="h-4 w-4" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {isSubmitting
              ? scheduleEnabled ? "Scheduling…" : "Launching…"
              : scheduleEnabled ? "Schedule Broadcast" : "Send Broadcast"}
          </Button>
        </div>
      </div>
    </div>
  );
}
