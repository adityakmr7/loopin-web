"use client";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Instagram, Loader2, Plus, Trash2, RefreshCw } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface InstagramAccount {
  id: string;
  username: string;
  profilePictureUrl?: string;
  followersCount: number;
  mediaCount: number;
  isConnected: boolean;
}

export default function AccountsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: accounts, isLoading } = useQuery<InstagramAccount[]>({
    queryKey: ["instagram", "accounts"],
    queryFn: async () => {
      const { data } = await api.get("/instagram/accounts");
      return data.data;
    },
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.get("/instagram/auth");
      return data.data;
    },
    onSuccess: (data) => {
      // Redirect to Instagram OAuth
      window.location.href = data.authorizationUrl;
    },
    onError: (error: AxiosError<{ error: string }>) => {
      toast.error("Connection failed", {
        description: error.response?.data?.error || "Could not start OAuth flow",
      });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/instagram/accounts/${id}/disconnect`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instagram", "accounts"] });
      toast.success("Account disconnected");
    },
    onError: () => toast.error("Failed to disconnect"),
  });

  const refreshMutation = useMutation({
     mutationFn: async (id: string) => {
        await api.post(`/instagram/accounts/${id}/refresh`);
     },
     onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["instagram", "accounts"] });
        toast.success("Account data refreshed");
     },
     onError: () => toast.error("Failed to refresh data"),
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Accounts</h1>
          <p className="text-slate-400">Manage your connected Instagram accounts</p>
        </div>
        <Button 
          onClick={() => connectMutation.mutate()} 
          disabled={connectMutation.isPending}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          {connectMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          Connect Account
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
           <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : accounts && accounts.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <Card key={account.id} className="bg-slate-900 border-slate-800 overflow-hidden">
              <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-4">
                <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-700">
                   {account.profilePictureUrl ? (
                      <img src={account.profilePictureUrl} alt={account.username} className="h-full w-full object-cover" />
                   ) : (
                      <Instagram className="h-6 w-6 text-slate-400" />
                   )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <CardTitle className="text-lg truncate">@{account.username}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                     {account.isConnected ? (
                        <Badge variant="default" className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20">Active</Badge>
                     ) : (
                        <Badge variant="destructive">Disconnected</Badge>
                     )}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4">
                 <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex flex-col gap-1 p-3 rounded-lg bg-slate-950/50 border border-slate-800/50">
                       <span className="text-slate-500">Followers</span>
                       <span className="font-semibold text-white">{account.followersCount}</span>
                    </div>
                    <div className="flex flex-col gap-1 p-3 rounded-lg bg-slate-950/50 border border-slate-800/50">
                       <span className="text-slate-500">Posts</span>
                       <span className="font-semibold text-white">{account.mediaCount}</span>
                    </div>
                 </div>
                 
                 <div className="flex items-center gap-2 mt-2">
                    <Button 
                       variant="outline" 
                       size="sm" 
                       className="flex-1 border-slate-800 hover:bg-slate-800"
                       onClick={() => refreshMutation.mutate(account.id)}
                       disabled={refreshMutation.isPending}
                    >
                       <RefreshCw className={`mr-2 h-3.5 w-3.5 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
                       Sync
                    </Button>
                    <Button 
                       variant="destructive" 
                       size="sm" 
                       className="flex-shrink-0"
                       onClick={() => disconnectMutation.mutate(account.id)}
                       disabled={disconnectMutation.isPending}
                    >
                       <Trash2 className="h-4 w-4" />
                    </Button>
                 </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-slate-900 border-slate-800 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
              <Instagram className="h-8 w-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No accounts connected</h3>
            <p className="text-slate-400 max-w-sm mb-6">
              Connect your Instagram Business account to start automating your comments and messages.
            </p>
            <Button onClick={() => connectMutation.mutate()} className="bg-indigo-600 hover:bg-indigo-700 text-white">
               <Plus className="mr-2 h-4 w-4" />
               Connect Instagram
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
