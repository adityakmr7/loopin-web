"use client";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Loader2, Plus, Zap, MessageSquare, AtSign, Trash2, Edit } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface Action {
  reply: string;
  like: boolean;
}

interface AutomationRule {
  id: string;
  name: string;
  description: string | null;
  trigger: "comment" | "mention" | "message";
  isActive: boolean;
  triggerCount: number;
  lastTriggered: string | null;
  createdAt: string;
  account: {
    username: string;
  };
}

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
    onError: () => {
      toast.error("Failed to update rule");
    },
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/automation/rules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation", "rules"] });
      toast.success("Rule deleted");
    },
    onError: () => {
       toast.error("Failed to delete rule");
    }
  });

  const getTriggerIcon = (trigger: string) => {
    switch (trigger) {
      case "comment":
        return <MessageSquare className="h-4 w-4 text-blue-400" />;
      case "mention":
        return <AtSign className="h-4 w-4 text-orange-400" />;
      default:
        return <Zap className="h-4 w-4 text-yellow-400" />;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Automation Rules</h1>
          <p className="text-slate-400">Design your auto-reply workflows</p>
        </div>
        <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white">
          <Link href="/automation/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Rule
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
           <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : rules && rules.length > 0 ? (
        <div className="grid gap-6">
          {rules.map((rule) => (
            <Card key={rule.id} className="bg-slate-900 border-slate-800 transition-all hover:border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                   <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-slate-800/50">
                           {getTriggerIcon(rule.trigger)}
                        </div>
                        <h3 className="font-semibold text-lg text-slate-100">{rule.name}</h3>
                        <Badge variant="outline" className="ml-2 border-slate-700 text-slate-400">
                          @{rule.account.username}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-400 pl-11">{rule.description || "No description"}</p>
                   </div>
                   
                   <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-950/50 px-3 py-1.5 rounded-full border border-slate-800">
                         <Zap className="h-3 w-3" />
                         <span>{rule.triggerCount} runs</span>
                      </div>
                      <Switch 
                         checked={rule.isActive}
                         onCheckedChange={(checked) => toggleMutation.mutate({ id: rule.id, isActive: checked })}
                      />
                      <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white" asChild>
                         <Link href={`/automation/${rule.id}/edit`}>
                           <Edit className="h-4 w-4" />
                         </Link>
                      </Button>
                      <Button 
                         variant="ghost" 
                         size="icon" 
                         className="text-slate-400 hover:text-red-400"
                         onClick={() => {
                            if (confirm("Are you sure you want to delete this rule?")) {
                               deleteMutation.mutate(rule.id);
                            }
                         }}
                      >
                         <Trash2 className="h-4 w-4" />
                      </Button>
                   </div>
                </div>
                
                <div className="mt-4 pl-11 flex items-center gap-4 text-xs text-slate-500">
                   {rule.lastTriggered && (
                      <span>Last run {formatDistanceToNow(new Date(rule.lastTriggered))} ago</span>
                   )}
                   {!rule.lastTriggered && <span>Never run</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-slate-900 border-slate-800 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
             <div className="h-20 w-20 rounded-full bg-slate-800/50 flex items-center justify-center mb-6 ring-1 ring-white/10">
                <Zap className="h-10 w-10 text-indigo-400" />
             </div>
             <h3 className="text-xl font-medium text-white mb-2">No automation rules yet</h3>
             <p className="text-slate-400 max-w-md mb-8">
                Create your first rule to automatically reply to comments that contain specific keywords.
             </p>
             <Button asChild size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-8">
               <Link href="/automation/new">
                  <Plus className="mr-2 h-5 w-5" />
                  Create Your First Rule
               </Link>
             </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
