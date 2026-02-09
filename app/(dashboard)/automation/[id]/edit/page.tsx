"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { MessageSquare, AtSign, Zap, ChevronRight, Loader2, Plus, X, ArrowLeft } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { useRouter, useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Account {
  id: string;
  username: string;
}

interface UpdateRuleData {
  name: string;
  description: string;
  accountId: string;
  trigger: string;
  conditions: {
    text_contains: string[];
  };
  actions: {
    reply: string;
    like: boolean;
  };
}

interface AutomationRule {
  id: string;
  name: string;
  description: string | null;
  trigger: "comment" | "mention" | "message";
  conditions: {
    text_contains: string[];
  };
  actions: {
    reply: string;
    like: boolean;
  };
  isActive: boolean;
  account: {
    id: string;
    username: string;
  };
}

export default function EditRulePage() {
  const router = useRouter();
  const params = useParams();
  const ruleId = params.id as string;
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Fetch existing rule data
  const { data: rule, isLoading: isLoadingRule } = useQuery<AutomationRule>({
    queryKey: ["automation", "rule", ruleId],
    queryFn: async () => {
      const { data } = await api.get(`/automation/rules/${ruleId}`);
      return data.data;
    },
    enabled: !!ruleId
  });

  // Fetch accounts
  const { data: accounts } = useQuery<Account[]>({
    queryKey: ["instagram", "accounts"],
    queryFn: async () => {
      const { data } = await api.get("/instagram/accounts");
      return data.data || [];
    }
  });

  // Initialize form data - use rule data if available, otherwise use defaults
  const [formData, setFormData] = useState<UpdateRuleData>(() => rule ? {
    name: rule.name,
    description: rule.description || "",
    accountId: rule.account.id,
    trigger: rule.trigger,
    conditions: rule.conditions,
    actions: rule.actions
  } : {
    name: "",
    description: "",
    accountId: "",
    trigger: "comment",
    conditions: {
      text_contains: []
    },
    actions: {
      reply: "",
      like: true
    }
  });

  const [keywords, setKeywords] = useState<string[]>(rule?.conditions.text_contains || []);
  const [inputKeyword, setInputKeyword] = useState("");

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateRuleData) => {
      await api.patch(`/automation/rules/${ruleId}`, data);
    },
    onSuccess: () => {
      toast.success("Rule updated successfully!");
      router.push("/automation");
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error("Failed to update rule", {
         description: err.response?.data?.error || "Unknown error occurred"
      });
      setLoading(false);
    }
  });

  const handleUpdate = () => {
    if (!formData.name || !formData.accountId) {
      toast.error("Please select an account and name your rule");
      return;
    }
    
    setLoading(true);
    updateMutation.mutate({
       ...formData,
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

  if (isLoadingRule) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  // Don't render the form until we have rule data
  if (!rule) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8" key={ruleId}>
      <div>
        <Link 
          href="/automation" 
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-300 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Automation
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Edit Rule</h1>
        <p className="text-slate-400">Update your automation logic</p>
      </div>

      {/* Progress Steps */}
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

      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-6 space-y-6">
          
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
                   <div className="grid grid-cols-2 gap-4">
                      <div 
                        className={cn("cursor-pointer border rounded-lg p-4 flex flex-col gap-2 transition-all", formData.trigger === "comment" ? "bg-indigo-900/20 border-indigo-500/50" : "bg-slate-950 border-slate-800 hover:border-slate-700")}
                        onClick={() => setFormData({...formData, trigger: "comment"})}
                      >
                         <MessageSquare className={cn("h-5 w-5", formData.trigger === "comment" ? "text-indigo-400" : "text-slate-500")} />
                         <span className="font-medium text-sm">New Comment</span>
                      </div>
                      <div 
                        className={cn("cursor-pointer border rounded-lg p-4 flex flex-col gap-2 transition-all", formData.trigger === "mention" ? "bg-purple-900/20 border-purple-500/50" : "bg-slate-950 border-slate-800 hover:border-slate-700")}
                        onClick={() => setFormData({...formData, trigger: "mention"})}
                      >
                         <AtSign className={cn("h-5 w-5", formData.trigger === "mention" ? "text-purple-400" : "text-slate-500")} />
                         <span className="font-medium text-sm">Mentioned in Story</span>
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
                      <Label className="text-xs uppercase text-slate-500">Keywords (Exact or partial match)</Label>
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
             </div>
          )}

          {step === 3 && (
             <div className="space-y-6">
                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                      <Label className="text-base">Like Comment?</Label>
                      <Switch 
                         checked={formData.actions.like}
                         onCheckedChange={(c) => setFormData({
                            ...formData, 
                            actions: { ...formData.actions, like: c }
                         })}
                      />
                   </div>
                   
                   <div className="space-y-2">
                      <Label>Reply with Message</Label>
                      <Textarea 
                         placeholder="Hey! Thanks for the comment! 🔥" 
                         className="bg-slate-950 border-slate-800 min-h-[120px]"
                         value={formData.actions.reply}
                         onChange={(e) => setFormData({
                            ...formData, 
                            actions: { ...formData.actions, reply: e.target.value }
                         })}
                      />
                      <p className="text-xs text-slate-500 text-right">
                         {formData.actions.reply.length} / 1000 characters
                      </p>
                   </div>
                </div>
             </div>
          )}

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
                   onClick={handleUpdate} 
                   className="bg-indigo-600 hover:bg-indigo-700 text-white"
                   disabled={loading}
                >
                   {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                   Update Rule
                </Button>
             )}
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
