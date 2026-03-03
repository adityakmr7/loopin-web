"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Webhook, Plus, Trash2, Play, Loader2, X, CheckSquare, Square } from "lucide-react";
import {
  useWebhooks,
  useCreateWebhook,
  useUpdateWebhook,
  useDeleteWebhook,
  useTestWebhook,
  type WebhookEventType,
  type OutboundWebhook,
} from "@/hooks/useWebhooks";
import { cn } from "@/lib/utils";
import { FeatureGate } from "@/components/ui/feature-gate";

const ALL_EVENTS: { value: WebhookEventType; label: string; description: string }[] = [
  { value: "rule_matched", label: "Rule Matched", description: "Fires when an automation rule executes" },
  { value: "dm_received", label: "DM Received", description: "Fires when a new DM arrives" },
  { value: "comment_received", label: "Comment Received", description: "Fires when a new comment arrives" },
  { value: "broadcast_completed", label: "Broadcast Completed", description: "Fires when a mass DM broadcast finishes" },
];

const EVENT_COLORS: Record<WebhookEventType, string> = {
  rule_matched: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  dm_received: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  comment_received: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  broadcast_completed: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

function EventBadge({ event }: { event: WebhookEventType }) {
  const meta = ALL_EVENTS.find((e) => e.value === event);
  return (
    <span className={cn("text-xs px-2 py-0.5 rounded border font-medium", EVENT_COLORS[event])}>
      {meta?.label ?? event}
    </span>
  );
}

interface WebhookFormData {
  name: string;
  url: string;
  events: WebhookEventType[];
  secret: string;
}

const DEFAULT_FORM: WebhookFormData = { name: "", url: "", events: ["rule_matched"], secret: "" };

function WebhookForm({
  initial,
  onSubmit,
  onCancel,
  loading,
}: {
  initial?: WebhookFormData;
  onSubmit: (data: WebhookFormData) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<WebhookFormData>(initial ?? DEFAULT_FORM);

  const toggleEvent = (event: WebhookEventType) => {
    setForm((f) => ({
      ...f,
      events: f.events.includes(event) ? f.events.filter((e) => e !== event) : [...f.events, event],
    }));
  };

  return (
    <div className="rounded-xl border border-indigo-500/30 bg-slate-900 p-6 space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Webhook Name</Label>
          <Input
            placeholder="e.g. Zapier Integration"
            className="bg-slate-950 border-slate-800"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Endpoint URL</Label>
          <Input
            placeholder="https://hooks.zapier.com/..."
            className="bg-slate-950 border-slate-800"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Secret <span className="text-slate-500 font-normal">(optional — used for HMAC signature)</span></Label>
        <Input
          placeholder="your-signing-secret"
          className="bg-slate-950 border-slate-800 font-mono text-sm"
          value={form.secret}
          onChange={(e) => setForm({ ...form, secret: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Events to Subscribe</Label>
        <div className="grid grid-cols-2 gap-2">
          {ALL_EVENTS.map((ev) => {
            const selected = form.events.includes(ev.value);
            return (
              <button
                key={ev.value}
                type="button"
                className={cn(
                  "flex items-start gap-2.5 rounded-lg border p-3 text-left transition-all",
                  selected
                    ? "border-indigo-500/40 bg-indigo-500/10"
                    : "border-slate-800 bg-slate-950 hover:border-slate-700"
                )}
                onClick={() => toggleEvent(ev.value)}
              >
                {selected ? (
                  <CheckSquare className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                ) : (
                  <Square className="h-4 w-4 text-slate-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="text-sm font-medium text-slate-200">{ev.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{ev.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="ghost" onClick={onCancel} className="text-slate-400">Cancel</Button>
        <Button
          className="bg-indigo-600 hover:bg-indigo-500 text-white"
          onClick={() => onSubmit(form)}
          disabled={loading || !form.name.trim() || !form.url.trim() || form.events.length === 0}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Webhook
        </Button>
      </div>
    </div>
  );
}

function WebhookRow({ webhook }: { webhook: OutboundWebhook }) {
  const updateMutation = useUpdateWebhook();
  const deleteMutation = useDeleteWebhook();
  const testMutation = useTestWebhook();

  return (
    <div className="flex items-center justify-between px-6 py-4">
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div className="h-9 w-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
          <Webhook className="h-4 w-4 text-slate-400" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-slate-200">{webhook.name}</p>
            {webhook.events.map((e) => <EventBadge key={e} event={e} />)}
          </div>
          <p className="text-xs text-slate-500 truncate mt-0.5 font-mono">{webhook.url}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0 ml-4">
        <Switch
          checked={webhook.isActive}
          onCheckedChange={(v) => updateMutation.mutate({ id: webhook.id, isActive: v })}
          className="data-[state=checked]:bg-emerald-600"
        />
        <Button
          variant="ghost"
          size="sm"
          className="text-slate-400 hover:text-indigo-400 hover:bg-indigo-400/10 gap-1.5 text-xs"
          onClick={() => testMutation.mutate(webhook.id)}
          disabled={testMutation.isPending}
        >
          {testMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
          Test
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-500 hover:text-red-400 hover:bg-red-400/10"
          onClick={() => deleteMutation.mutate(webhook.id)}
          disabled={deleteMutation.isPending}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function WebhooksPage() {
  const { data: webhooks, isLoading } = useWebhooks();
  const createMutation = useCreateWebhook();
  const [showForm, setShowForm] = useState(false);

  const handleCreate = async (form: WebhookFormData) => {
    await createMutation.mutateAsync({
      name: form.name,
      url: form.url,
      events: form.events,
      secret: form.secret || undefined,
    });
    setShowForm(false);
  };

  return (
    <FeatureGate plan="pro" mode="page" label="Webhooks">
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Outbound Webhooks</h1>
          <p className="text-slate-400 mt-1">Receive real-time events in your own apps and integrations</p>
        </div>
        {!showForm && (
          <Button
            className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2"
            onClick={() => setShowForm(true)}
          >
            <Plus className="h-4 w-4" /> Add Webhook
          </Button>
        )}
      </div>

      {/* Create form */}
      {showForm && (
        <WebhookForm
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
          loading={createMutation.isPending}
        />
      )}

      {/* Webhook list */}
      <div className="rounded-xl border border-slate-800 bg-slate-900">
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <p className="text-base font-semibold text-slate-100">Active Webhooks</p>
            <span className="text-xs text-slate-500">{webhooks?.length ?? 0} configured</span>
          </div>
          <div className="h-px bg-slate-800 mt-3" />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
          </div>
        ) : !webhooks || webhooks.length === 0 ? (
          <div className="px-6 pb-6">
            <div className="rounded-xl border border-dashed border-slate-800 p-8 flex flex-col items-center justify-center gap-3 text-center">
              <div className="h-14 w-14 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center">
                <Webhook className="h-6 w-6 text-indigo-400" />
              </div>
              <div>
                <p className="font-medium text-slate-300">No webhooks yet</p>
                <p className="text-sm text-slate-500 mt-0.5">Add a webhook to receive Loopin events in your apps</p>
              </div>
              <Button
                variant="outline"
                className="border-slate-700 text-slate-300 hover:text-indigo-400 hover:border-indigo-500/50 gap-2 mt-1"
                onClick={() => setShowForm(true)}
              >
                <Plus className="h-4 w-4" /> Add your first webhook
              </Button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {webhooks.map((w) => <WebhookRow key={w.id} webhook={w} />)}
          </div>
        )}
      </div>

      {/* Payload format reference */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-3">
        <p className="text-sm font-semibold text-slate-100">Payload Format</p>
        <p className="text-xs text-slate-500">Every delivery is a POST request with this JSON body:</p>
        <pre className="text-xs text-slate-300 bg-slate-950 rounded-lg p-4 overflow-x-auto border border-slate-800">
{`{
  "event": "rule_matched",
  "payload": {
    "ruleId": "...",
    "ruleName": "My Rule",
    "trigger": "comment",
    "username": "@someone"
  },
  "deliveredAt": "2026-03-03T12:00:00.000Z"
}`}
        </pre>
        <p className="text-xs text-slate-500">
          When a secret is set, the <code className="text-slate-300 bg-slate-800 px-1 rounded">X-Loopin-Signature</code> header contains{" "}
          <code className="text-slate-300 bg-slate-800 px-1 rounded">sha256=HMAC(secret, body)</code> for verification.
        </p>
      </div>
    </div>
    </FeatureGate>
  );
}
