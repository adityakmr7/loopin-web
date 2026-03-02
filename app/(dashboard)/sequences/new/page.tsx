"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, AtSign, MessageCircle, ChevronRight, Loader2, Plus, X, Variable, Trash2 } from "lucide-react";
import api from "@/lib/api";
import { useCreateSequence } from "@/hooks/useSequence";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TEMPLATE_VARS = [
  { label: "{{name}}", title: "Contact's display name" },
  { label: "{{username}}", title: "Contact's @handle" },
  { label: "{{account}}", title: "Your connected account's @handle" },
];

function VariablePicker({ onInsert }: { onInsert: (v: string) => void }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap pt-1">
      <Variable className="h-3 w-3 text-slate-500 shrink-0" />
      <span className="text-xs text-slate-500">Variables:</span>
      {TEMPLATE_VARS.map((v) => (
        <button
          key={v.label}
          type="button"
          title={v.title}
          onClick={() => onInsert(v.label)}
          className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors font-mono"
        >
          {v.label}
        </button>
      ))}
    </div>
  );
}

function getErrorMessage(error: unknown, fallback = "An unknown error occurred"): string {
  const err = error as { response?: { data?: { error?: unknown } }; message?: string };
  const apiError = err?.response?.data?.error;
  if (typeof apiError === "string") return apiError;
  if (typeof err?.message === "string") return err.message;
  return fallback;
}

interface Account {
  id: string;
  username: string;
}

interface SequenceStepForm {
  stepNumber: number;
  delayDays: number;
  message: string;
}

export default function NewSequencePage() {
  const [step, setStep] = useState(1);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [accountId, setAccountId] = useState("");
  const [trigger, setTrigger] = useState<"comment" | "mention" | "message">("comment");

  const [keywords, setKeywords] = useState<string[]>([]);
  const [inputKeyword, setInputKeyword] = useState("");

  const [steps, setSteps] = useState<SequenceStepForm[]>([
    { stepNumber: 1, delayDays: 0, message: "" },
  ]);

  const { data: accounts } = useQuery<Account[]>({
    queryKey: ["instagram", "accounts"],
    queryFn: async () => {
      const { data } = await api.get("/instagram/accounts");
      return data.data || [];
    },
  });

  const createMutation = useCreateSequence();

  const addKeyword = () => {
    if (inputKeyword.trim()) {
      setKeywords([...keywords, inputKeyword.trim()]);
      setInputKeyword("");
    }
  };

  const addStep = () => {
    const lastStep = steps[steps.length - 1];
    setSteps([
      ...steps,
      {
        stepNumber: steps.length + 1,
        delayDays: lastStep.delayDays + 1,
        message: "",
      },
    ]);
  };

  const removeStep = (index: number) => {
    if (steps.length <= 1) return;
    const updated = steps
      .filter((_, i) => i !== index)
      .map((s, i) => ({ ...s, stepNumber: i + 1 }));
    setSteps(updated);
  };

  const updateStep = (index: number, field: keyof SequenceStepForm, value: string | number) => {
    setSteps(steps.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const insertVar = (index: number, v: string) => {
    setSteps(steps.map((s, i) => (i === index ? { ...s, message: s.message + v } : s)));
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Please enter a sequence name");
      return;
    }
    if (!accountId) {
      toast.error("Please select an account");
      return;
    }
    if (steps.some((s) => !s.message.trim())) {
      toast.error("All steps must have a message");
      return;
    }

    try {
      await createMutation.mutateAsync({
        accountId,
        name: name.trim(),
        description: description.trim() || undefined,
        trigger,
        conditions: { text_contains: keywords },
        steps: steps.map((s) => ({
          stepNumber: s.stepNumber,
          delayDays: s.delayDays,
          message: s.message.trim(),
        })),
      });
    } catch (error) {
      toast.error("Failed to create sequence", { description: getErrorMessage(error) });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Sequence</h1>
        <p className="text-slate-400">Build a multi-step DM campaign</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-4 text-sm font-medium">
        {[
          { n: 1, label: "Setup" },
          { n: 2, label: "Keywords" },
          { n: 3, label: "Steps" },
        ].map(({ n, label }, i, arr) => (
          <div key={n} className="flex items-center gap-4">
            <div className={cn("flex items-center gap-2", step >= n ? "text-indigo-400" : "text-slate-500")}>
              <div className={cn("h-6 w-6 rounded-full flex items-center justify-center border", step >= n ? "bg-indigo-500/10 border-indigo-500/50" : "border-slate-700")}>
                {n}
              </div>
              {label}
            </div>
            {i < arr.length - 1 && <div className="h-px w-8 bg-slate-800" />}
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900">
        <div className="p-6 space-y-6">

          {/* Step 1 — Setup */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Sequence Name</Label>
                <Input
                  placeholder="e.g. Lead Nurture Sequence"
                  className="bg-slate-950 border-slate-800"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Description <span className="text-slate-500 font-normal">(optional)</span></Label>
                <Input
                  placeholder="e.g. 3-day follow-up for users who comment 'info'"
                  className="bg-slate-950 border-slate-800"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Account</Label>
                <Select onValueChange={setAccountId} value={accountId}>
                  <SelectTrigger className="bg-slate-950 border-slate-800">
                    <SelectValue placeholder="Choose account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts?.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>@{acc.username}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Trigger</Label>
                <div className="grid grid-cols-3 gap-3">
                  <div
                    className={cn("cursor-pointer border rounded-lg p-4 flex flex-col gap-2 transition-all", trigger === "comment" ? "bg-indigo-900/20 border-indigo-500/50" : "bg-slate-950 border-slate-800 hover:border-slate-700")}
                    onClick={() => setTrigger("comment")}
                  >
                    <MessageSquare className={cn("h-5 w-5", trigger === "comment" ? "text-indigo-400" : "text-slate-500")} />
                    <span className="font-medium text-sm">Comment</span>
                  </div>
                  <div
                    className={cn("cursor-pointer border rounded-lg p-4 flex flex-col gap-2 transition-all", trigger === "mention" ? "bg-purple-900/20 border-purple-500/50" : "bg-slate-950 border-slate-800 hover:border-slate-700")}
                    onClick={() => setTrigger("mention")}
                  >
                    <AtSign className={cn("h-5 w-5", trigger === "mention" ? "text-purple-400" : "text-slate-500")} />
                    <span className="font-medium text-sm">Mention</span>
                  </div>
                  <div
                    className={cn("cursor-pointer border rounded-lg p-4 flex flex-col gap-2 transition-all", trigger === "message" ? "bg-emerald-900/20 border-emerald-500/50" : "bg-slate-950 border-slate-800 hover:border-slate-700")}
                    onClick={() => setTrigger("message")}
                  >
                    <MessageCircle className={cn("h-5 w-5", trigger === "message" ? "text-emerald-400" : "text-slate-500")} />
                    <span className="font-medium text-sm">DM</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2 — Keywords */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                <h3 className="text-sm font-medium mb-1">Keyword Conditions</h3>
                <p className="text-xs text-slate-400 mb-4">
                  Contacts will be enrolled when their {trigger} contains any of these keywords. Leave empty to enroll everyone.
                </p>

                <div className="space-y-2">
                  <Label className="text-xs uppercase text-slate-500">Keywords (partial match)</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type keyword & press Enter"
                      className="bg-slate-900 border-slate-700"
                      value={inputKeyword}
                      onChange={(e) => setInputKeyword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addKeyword()}
                    />
                    <Button variant="secondary" onClick={addKeyword}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {keywords.map((kw, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-sm">
                        {kw}
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-indigo-300"
                          onClick={() => setKeywords(keywords.filter((_, idx) => idx !== i))}
                        />
                      </span>
                    ))}
                    {keywords.length === 0 && (
                      <span className="text-sm text-slate-500 italic">No keywords (enrolls on any {trigger})</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3 — Sequence Steps */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-100">DM Steps</h3>
                <p className="text-xs text-slate-400 mt-0.5">Each step sends a DM after the specified delay. Step 1 always sends immediately.</p>
              </div>

              <div className="space-y-3">
                {steps.map((s, i) => (
                  <div key={i} className="rounded-lg border border-slate-800 bg-slate-950 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="h-6 w-6 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-400">
                          {s.stepNumber}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-300">
                            {s.delayDays === 0 ? "Sends immediately" : `Day ${s.delayDays}`}
                          </span>
                          {s.stepNumber > 1 && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-slate-500">delay:</span>
                              <input
                                type="number"
                                min={0}
                                value={s.delayDays}
                                onChange={(e) => updateStep(i, "delayDays", parseInt(e.target.value, 10) || 0)}
                                className="w-14 text-xs bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-slate-300"
                              />
                              <span className="text-xs text-slate-500">days</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {steps.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-slate-500 hover:text-red-400 hover:bg-red-400/10"
                          onClick={() => removeStep(i)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                    <div className="p-4 space-y-2">
                      <Textarea
                        placeholder={`Hey {{name}}! ${i === 0 ? "Thanks for your interest 👋" : "Just following up..."}`}
                        className="bg-slate-900 border-slate-700 min-h-24"
                        maxLength={1000}
                        value={s.message}
                        onChange={(e) => updateStep(i, "message", e.target.value)}
                      />
                      <VariablePicker onInsert={(v) => insertVar(i, v)} />
                      <p className="text-xs text-slate-500 text-right">{s.message.length} / 1000</p>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                className="w-full border-slate-700 border-dashed text-slate-400 hover:text-indigo-400 hover:border-indigo-500/50"
                onClick={addStep}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Step
              </Button>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-6 border-t border-slate-800">
            <Button
              variant="ghost"
              onClick={() => setStep(s => Math.max(1, s - 1))}
              disabled={step === 1}
            >
              Back
            </Button>

            {step < 3 ? (
              <Button onClick={() => setStep(s => Math.min(3, s + 1))}>
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                className="bg-indigo-600 hover:bg-indigo-500 text-white"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Sequence
              </Button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
