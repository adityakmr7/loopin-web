"use client";

import { Button } from "@/components/ui/button";
import { Instagram, Loader2, Plus, Trash2, RefreshCw, Users, ImageIcon } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface InstagramAccount {
  id: string;
  username: string;
  profilePictureUrl?: string;
  followersCount: number;
  mediaCount: number;
  isConnected: boolean;
}

export default function AccountsPage() {
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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Accounts</h1>
          <p className="text-slate-400 mt-1">Manage your connected Instagram accounts</p>
        </div>
        <Button
          onClick={() => connectMutation.mutate()}
          disabled={connectMutation.isPending}
          className="bg-indigo-600 hover:bg-indigo-500 text-white shrink-0"
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
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : accounts && accounts.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="relative rounded-xl border border-slate-800 bg-slate-900 overflow-hidden hover:border-slate-700 transition-colors flex flex-col"
            >
              {/* Accent bar */}
              <div className="h-0.5 w-full bg-gradient-to-r from-indigo-500 to-purple-500" />

              {/* Status dot */}
              <div className="absolute top-4 right-4">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border",
                    account.isConnected
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      : "bg-red-500/10 border-red-500/20 text-red-400"
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      account.isConnected ? "bg-emerald-400" : "bg-red-400"
                    )}
                  />
                  {account.isConnected ? "Active" : "Disconnected"}
                </span>
              </div>

              <div className="p-5 flex-1">
                {/* Profile */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-700 shrink-0">
                    {account.profilePictureUrl ? (
                      <img
                        src={account.profilePictureUrl}
                        alt={account.username}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Instagram className="h-5 w-5 text-slate-500" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-100 truncate">@{account.username}</p>
                    <p className="text-xs text-slate-500">Instagram Business</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="rounded-lg bg-slate-950/60 border border-slate-800/60 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Users className="h-3 w-3 text-slate-500" />
                      <span className="text-[11px] text-slate-500 uppercase tracking-wide">Followers</span>
                    </div>
                    <p className="text-lg font-bold text-slate-100 tabular-nums">
                      {account.followersCount.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-950/60 border border-slate-800/60 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <ImageIcon className="h-3 w-3 text-slate-500" />
                      <span className="text-[11px] text-slate-500 uppercase tracking-wide">Posts</span>
                    </div>
                    <p className="text-lg font-bold text-slate-100 tabular-nums">
                      {account.mediaCount.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                    onClick={() => refreshMutation.mutate(account.id)}
                    disabled={refreshMutation.isPending}
                  >
                    <RefreshCw
                      className={cn("mr-1.5 h-3.5 w-3.5", refreshMutation.isPending && "animate-spin")}
                    />
                    Sync
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-700 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 text-slate-500"
                    onClick={() => disconnectMutation.mutate(account.id)}
                    disabled={disconnectMutation.isPending}
                  >
                    {disconnectMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border border-dashed border-slate-800">
          <div className="h-14 w-14 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-4">
            <Instagram className="h-7 w-7 text-indigo-400" />
          </div>
          <h3 className="text-base font-semibold text-slate-200 mb-1">No accounts connected</h3>
          <p className="text-sm text-slate-500 max-w-xs mb-6">
            Connect your Instagram Business account to start automating comments and messages.
          </p>
          <Button
            onClick={() => connectMutation.mutate()}
            disabled={connectMutation.isPending}
            className="bg-indigo-600 hover:bg-indigo-500 text-white"
          >
            {connectMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Connect Instagram
          </Button>
        </div>
      )}
    </div>
  );
}
