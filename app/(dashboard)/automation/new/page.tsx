"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { MessageSquare, AtSign, Zap, ChevronRight, Loader2, Plus, X, Variable, ImageIcon, MessageCircle, Sparkles, PenLine } from "lucide-react";
import { PostFilterPicker } from "@/components/automation/PostFilterPicker";
import { useQuery, useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AUTOMATION_TEMPLATES, type AutomationTemplate } from "@/data/automation-templates";

const TEMPLATE_VARS = [
  { label: "{{name}}", title: "Commenter's display name" },
  { label: "{{username}}", title: "Commenter's @handle" },
  { label: "{{keyword}}", title: "The keyword that triggered this rule" },
  { label: "{{account}}", title: "Your connected account's @handle" },
];

const CATEGORY_STYLES: Record<string, string> = {
  lead_gen: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  engagement: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  support: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

const CATEGORY_LABELS: Record<string, string> = {
  lead_gen: "Lead Gen",
  engagement: "Engagement",
  support: "Support",
};

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

// Safely extract a human-readable string from any API error shape
function getErrorMessage(error: unknown, fallback = "An unknown error occurred"): string {
  const err = error as { response?: { data?: { error?: unknown; message?: unknown } }; message?: string };
  const apiError = err?.response?.data?.error ?? err?.response?.data?.message;
  if (typeof apiError === "string") return apiError;
  if (apiError && typeof apiError === "object") {
    const obj = apiError as { message?: unknown };
    if (typeof obj.message === "string") return obj.message;
  }
  if (typeof err?.message === "string") return err.message;
  return fallback;
}

interface Account {
  id: string;
  username: string;
}

interface CreateRuleData {
  name: string;
  description: string;
  accountId: string;
  trigger: string;
  postFilter: string[];
  conditions: {
    text_contains: string[];
  };
  actions: {
    reply?: string;
    like?: boolean;
    hide?: boolean;
    comment_to_dm?: string;
    reply_dm?: string;
  };
}

const DEFAULT_FORM: CreateRuleData = {
  name: "",
  description: "",
  accountId: "",
  trigger: "comment",
  postFilter: [],
  conditions: { text_contains: [] },
  actions: { reply: "", like: true, hide: false, comment_to_dm: undefined },
};

export default function NewRulePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<CreateRuleData>(DEFAULT_FORM);

  // Separate toggle state so comment_to_dm / reply_dm is omitted when disabled
  const [dmEnabled, setDmEnabled] = useState(false);

  const [keywords, setKeywords] = useState<string[]>([]);
  const [inputKeyword, setInputKeyword] = useState("");

  const { data: accounts } = useQuery<Account[]>({
    queryKey: ["instagram", "accounts"],
    queryFn: async () => {
      const { data } = await api.get("/instagram/accounts");
      return data.data || [];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateRuleData) => {
      await api.post("/automation/rules", data);
    },
    onSuccess: () => {
      toast.success("Rule created successfully!");
      router.push("/automation");
    },
    onError: (error: unknown) => {
      toast.error("Failed to create rule", {
         description: getErrorMessage(error)
      });
      setLoading(false);
    }
  });

  const applyTemplate = (template: AutomationTemplate | null) => {
    if (template) {
      setFormData({
        ...DEFAULT_FORM,
        trigger: template.trigger,
        conditions: template.conditions,
        actions: {
          reply: template.actions.reply ?? "",
          like: template.actions.like ?? true,
          hide: template.actions.hide ?? false,
          comment_to_dm: template.actions.comment_to_dm,
          reply_dm: template.actions.reply_dm,
        },
      });
      setKeywords(template.conditions.text_contains);
      setDmEnabled(!!(template.actions.comment_to_dm || template.actions.reply_dm));
    } else {
      setFormData(DEFAULT_FORM);
      setKeywords([]);
      setDmEnabled(false);
    }
    setStep(1);
  };

  const handleCreate = () => {
    if (!formData.name || !formData.accountId) {
      toast.error("Please explicitly select an account and name your rule");
      return;
    }

    // Build clean actions based on trigger type
    const actions: CreateRuleData["actions"] = {};
    if (formData.trigger === "message") {
      if (dmEnabled && formData.actions.reply_dm?.trim()) {
        actions.reply_dm = formData.actions.reply_dm.trim();
      }
    } else {
      actions.reply = formData.actions.reply;
      actions.like = formData.actions.like;
      actions.hide = formData.actions.hide;
      if (dmEnabled && formData.actions.comment_to_dm?.trim()) {
        actions.comment_to_dm = formData.actions.comment_to_dm.trim();
      }
    }

    setLoading(true);
    createMutation.mutate({
       ...formData,
       actions,
       conditions: {
          text_contains: keywords
       }
    });
  };

  const addKeyword = () => {
    if (inputKeyword.trim()) {
      setKeywords([...keywords, inputKeyword.trim()]);
      setInputKeyword("");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create New Rule</h1>
        <p className="text-slate-400">Setup your automation logic</p>
      </div>

      {/* Progress Steps — only shown after template selection */}
      {step > 0 && (
        <div className="flex items-center gap-4 text-sm font-medium">
           <div className={cn("flex items-center gap-2", step >= 1 ? "text-indigo-400" : "text-slate-500")}>
              <div className={cn("h-6 w-6 rounded-full flex items-center justify-center border", step >= 1 ? "bg-indigo-500/10 border-indigo-500/50" : "border-slate-700")}>1</div>
              Trigger
           </div>
           <div className="h-px w-8 bg-slate-800" />
           <div className={cn("flex items-center gap-2", step >= 2 ? "text-indigo-400" : "text-slate-500")}>
              <div className={cn("h-6 w-6 rounded-full flex items-center justify-center border", step >= 2 ? "bg-indigo-500/10 border-indigo-500/50" : "border-slate-700")}>2</div>
              Conditions
           </div>
           <div className="h-px w-8 bg-slate-800" />
           <div className={cn("flex items-center gap-2", step >= 3 ? "text-indigo-400" : "text-slate-500")}>
              <div className={cn("h-6 w-6 rounded-full flex items-center justify-center border", step >= 3 ? "bg-indigo-500/10 border-indigo-500/50" : "border-slate-700")}>3</div>
              Actions
           </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-800 bg-slate-900">
        <div className="p-6 space-y-6">

          {/* Step 0 — Template Picker */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-semibold text-slate-100">Choose a template</h2>
                <p className="text-sm text-slate-400 mt-0.5">Start from a pre-built template or create your own from scratch</p>
              </div>

              {/* Start from scratch */}
              <div
                className="cursor-pointer rounded-xl border-2 border-dashed border-slate-700 p-4 flex items-center gap-4 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all group"
                onClick={() => applyTemplate(null)}
              >
                <div className="h-10 w-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 group-hover:border-indigo-500/30">
                  <PenLine className="h-5 w-5 text-slate-400 group-hover:text-indigo-400" />
                </div>
                <div>
                  <p className="font-medium text-sm text-slate-200">Start from scratch</p>
                  <p className="text-xs text-slate-500 mt-0.5">Build your own automation from the ground up</p>
                </div>
              </div>

              {/* Template grid */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-indigo-400" />
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Templates</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {AUTOMATION_TEMPLATES.map((template) => (
                    <div
                      key={template.id}
                      className="cursor-pointer rounded-xl border border-slate-800 bg-slate-950 p-4 hover:border-indigo-500/40 hover:bg-slate-900 transition-all group"
                      onClick={() => applyTemplate(template)}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="font-medium text-sm text-slate-200 group-hover:text-indigo-300 transition-colors">{template.name}</p>
                        <span className={cn("shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded border", CATEGORY_STYLES[template.category])}>
                          {CATEGORY_LABELS[template.category]}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">{template.description}</p>
                      <div className="mt-3 flex items-center gap-1.5">
                        {template.trigger === "comment" && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                            <MessageSquare className="h-2.5 w-2.5" /> Comment
                          </span>
                        )}
                        {template.trigger === "mention" && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                            <AtSign className="h-2.5 w-2.5" /> Mention
                          </span>
                        )}
                        {template.trigger === "message" && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                            <MessageCircle className="h-2.5 w-2.5" /> DM
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
             <div className="space-y-6">
                <div className="space-y-2">
                   <Label>Rule Name</Label>
                   <Input
                      placeholder="e.g. Pricing Auto-Reply"
                      className="bg-slate-950 border-slate-800"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                   />
                </div>

                <div className="space-y-2">
                   <Label>Select Account</Label>
                   <Select
                      onValueChange={(val) => setFormData({...formData, accountId: val})}
                      value={formData.accountId}
                   >
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
                   <Label>Trigger Event</Label>
                   <div className="grid grid-cols-3 gap-3">
                      <div
                        className={cn("cursor-pointer border rounded-lg p-4 flex flex-col gap-2 transition-all", formData.trigger === "comment" ? "bg-indigo-900/20 border-indigo-500/50" : "bg-slate-950 border-slate-800 hover:border-slate-700")}
                        onClick={() => { setFormData({...formData, trigger: "comment", postFilter: []}); setDmEnabled(false); }}
                      >
                         <MessageSquare className={cn("h-5 w-5", formData.trigger === "comment" ? "text-indigo-400" : "text-slate-500")} />
                         <span className="font-medium text-sm">New Comment</span>
                      </div>
                      <div
                        className={cn("cursor-pointer border rounded-lg p-4 flex flex-col gap-2 transition-all", formData.trigger === "mention" ? "bg-purple-900/20 border-purple-500/50" : "bg-slate-950 border-slate-800 hover:border-slate-700")}
                        onClick={() => { setFormData({...formData, trigger: "mention", postFilter: []}); setDmEnabled(false); }}
                      >
                         <AtSign className={cn("h-5 w-5", formData.trigger === "mention" ? "text-purple-400" : "text-slate-500")} />
                         <span className="font-medium text-sm">Mentioned in Story</span>
                      </div>
                      <div
                        className={cn("cursor-pointer border rounded-lg p-4 flex flex-col gap-2 transition-all", formData.trigger === "message" ? "bg-emerald-900/20 border-emerald-500/50" : "bg-slate-950 border-slate-800 hover:border-slate-700")}
                        onClick={() => { setFormData({...formData, trigger: "message", postFilter: []}); setDmEnabled(true); }}
                      >
                         <MessageCircle className={cn("h-5 w-5", formData.trigger === "message" ? "text-emerald-400" : "text-slate-500")} />
                         <span className="font-medium text-sm">DM Received</span>
                      </div>
                   </div>
                </div>
             </div>
          )}

          {step === 2 && (
             <div className="space-y-6">
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                   <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-emerald-400" />
                      Wait! Only run if...
                   </h3>
                   <p className="text-xs text-slate-400 mb-4">
                      Define keywords that must be present in the comment for this rule to trigger.
                   </p>

                   <div className="space-y-2">
                      <Label className="text-xs uppercase text-slate-500">
                        {formData.trigger === "message" ? "Keywords in DM (Exact or partial match)" : "Keywords (Exact or partial match)"}
                      </Label>
                      <div className="flex gap-2">
                         <Input
                            placeholder="Type keyword & press Enter"
                            className="bg-slate-900 border-slate-700"
                            value={inputKeyword}
                            onChange={(e) => setInputKeyword(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addKeyword()}
                         />
                         <Button variant="secondary" onClick={addKeyword}><Plus className="h-4 w-4" /></Button>
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
                            <span className="text-sm text-slate-500 italic">No keywords added (Runs on all comments)</span>
                         )}
                      </div>
                   </div>
                </div>

                {formData.trigger === "comment" && formData.accountId && (
                   <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                      <h3 className="text-sm font-medium mb-1 flex items-center gap-2">
                         <ImageIcon className="h-4 w-4 text-sky-400" />
                         Post filter (optional)
                      </h3>
                      <p className="text-xs text-slate-400 mb-4">
                         Select specific posts to target. Leave empty to run on all posts.
                      </p>
                      <PostFilterPicker
                         accountId={formData.accountId}
                         selectedPostIds={formData.postFilter}
                         onChange={(ids) => setFormData({ ...formData, postFilter: ids })}
                      />
                   </div>
                )}
             </div>
          )}

           {step === 3 && (
             <div className="space-y-6">
                {formData.trigger === "message" ? (
                  /* DM trigger: only reply_dm action */
                  <div className="space-y-4">
                    <div className="rounded-lg border border-emerald-800/50 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-300">
                      <strong>DM Keyword Automation</strong> — When someone sends you a DM containing the keywords you defined, Loopin will automatically reply.
                    </div>
                    <div className="space-y-2">
                      <Label>Auto-reply DM message</Label>
                      <p className="text-xs text-slate-500">This message will be sent as a DM reply when triggered.</p>
                      <Textarea
                        placeholder="Hey {{name}}! Thanks for reaching out. Here's what you need to know…"
                        className="bg-slate-950 border-slate-800 min-h-28"
                        maxLength={1000}
                        value={formData.actions.reply_dm ?? ""}
                        onChange={(e) => setFormData({
                          ...formData,
                          actions: { ...formData.actions, reply_dm: e.target.value }
                        })}
                      />
                      <VariablePicker onInsert={(v) => setFormData({ ...formData, actions: { ...formData.actions, reply_dm: (formData.actions.reply_dm ?? "") + v } })} />
                      <p className="text-xs text-slate-500 text-right">
                        {(formData.actions.reply_dm ?? "").length} / 1000 characters
                      </p>
                    </div>
                  </div>
                ) : (
                  /* comment / mention trigger actions */
                  <div className="space-y-4">
                   {/* Hide toggle */}
                   <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 px-4 py-3">
                      <div>
                         <Label className="text-sm font-medium">Hide Comment</Label>
                         <p className="text-xs text-slate-500 mt-0.5">Hide the matched comment from other users.</p>
                      </div>
                      <Switch
                         checked={formData.actions.hide ?? false}
                         onCheckedChange={(c) => setFormData({
                            ...formData,
                            actions: { ...formData.actions, hide: c }
                         })}
                         className="data-[state=checked]:bg-amber-600"
                      />
                   </div>

                   {/* Reply textarea */}
                   <div className="space-y-2">
                      <Label>Reply with Comment</Label>
                      <p className="text-xs text-slate-500">Post a public reply under the matched comment.</p>
                      <Textarea
                         placeholder="Hey {{name}}! Thanks for the comment! 🔥"
                         className="bg-slate-950 border-slate-800 min-h-25"
                         value={formData.actions.reply ?? ""}
                         onChange={(e) => setFormData({
                            ...formData,
                            actions: { ...formData.actions, reply: e.target.value }
                         })}
                      />
                      <VariablePicker onInsert={(v) => setFormData({ ...formData, actions: { ...formData.actions, reply: (formData.actions.reply ?? "") + v } })} />
                      <p className="text-xs text-slate-500 text-right">
                         {(formData.actions.reply ?? "").length} / 1000 characters
                      </p>
                   </div>

                   {/* Send DM toggle + textarea */}
                   <div className="rounded-lg border border-slate-800 bg-slate-950 overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3">
                         <div>
                            <Label className="text-sm font-medium">Send DM to commenter</Label>
                            <p className="text-xs text-slate-500 mt-0.5">Send a private Instagram DM to the person who commented.</p>
                         </div>
                         <Switch
                            checked={dmEnabled}
                            onCheckedChange={(c) => {
                               setDmEnabled(c);
                               if (!c) setFormData({ ...formData, actions: { ...formData.actions, comment_to_dm: undefined } });
                            }}
                            className="data-[state=checked]:bg-emerald-600"
                         />
                      </div>
                      {dmEnabled && (
                         <div className="px-4 pb-4 space-y-2 border-t border-slate-800">
                            <Textarea
                               placeholder="Hey {{name}}! Check out our full catalogue here → ..."
                               className="bg-slate-900 border-slate-700 min-h-25 mt-3"
                               maxLength={1000}
                               value={formData.actions.comment_to_dm ?? ""}
                               onChange={(e) => setFormData({
                                  ...formData,
                                  actions: { ...formData.actions, comment_to_dm: e.target.value }
                               })}
                            />
                            <VariablePicker onInsert={(v) => setFormData({ ...formData, actions: { ...formData.actions, comment_to_dm: (formData.actions.comment_to_dm ?? "") + v } })} />
                            <p className="text-xs text-slate-500 text-right">
                               {(formData.actions.comment_to_dm ?? "").length} / 1000 characters
                            </p>
                         </div>
                      )}
                   </div>
                  </div>
                )}
             </div>
           )}

          {step > 0 && (
            <div className="flex justify-between pt-6 border-t border-slate-800">
               <Button
                  variant="ghost"
                  onClick={() => setStep(s => Math.max(0, s - 1))}
               >
                  Back
               </Button>

               {step < 3 ? (
                  <Button onClick={() => setStep(s => Math.min(3, s + 1))}>
                     Next <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
               ) : (
                  <Button
                     onClick={handleCreate}
                     className="bg-indigo-600 hover:bg-indigo-500 text-white"
                     disabled={loading}
                  >
                     {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                     Create Rule
                  </Button>
               )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
