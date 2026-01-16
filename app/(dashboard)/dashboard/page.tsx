"use client";

import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Instagram, MessageSquare, Zap, Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Handle OAuth Redirects
  useEffect(() => {
    if (searchParams.get("instagram_connected") === "true") {
      toast.success("Instagram Connected!", {
        description: "Your account is now linked and ready for automation.",
      });
      // Clean URL
      router.replace("/dashboard");
    }
    
    const error = searchParams.get("error");
    if (error) {
       toast.error("Connection Failed", {
        description: decodeURIComponent(error),
       });
       router.replace("/dashboard");
    }
  }, [searchParams, router]);

  const { data: accounts, isLoading } = useQuery({
    queryKey: ["instagram", "accounts"],
    queryFn: async () => {
      const { data } = await api.get("/instagram/accounts");
      return data.data || [];
    }
  });

  const connectedAccount = accounts?.[0];

  // Placeholder stats - in a real app these would come from an API
  const stats = {
     activeRules: 0,
     eventsProcessed: connectedAccount ? 124 : 0, // Mock data for demo
     autoReplies: connectedAccount ? 43 : 0,      // Mock data for demo
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-slate-400">Welcome back, {user?.name}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Account Card */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Connected Account
            </CardTitle>
            <Instagram className="h-4 w-4 text-indigo-400" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
               <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
            ) : connectedAccount ? (
               <div>
                 <div className="text-xl font-bold truncate">@{connectedAccount.username}</div>
                 <p className="text-xs text-slate-500 mt-1">
                   {(connectedAccount.followersCount || 0).toLocaleString()} followers
                 </p>
               </div>
            ) : (
               <div>
                  <div className="text-sm text-slate-500 mb-3">No account connected</div>
                  <Button size="sm" variant="outline" className="w-full border-slate-700 hover:bg-slate-800" asChild>
                    <Link href="/accounts">Connect</Link>
                  </Button>
               </div>
            )}
          </CardContent>
        </Card>
        
        {/* Stats Cards */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Active Rules
            </CardTitle>
            <Zap className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeRules}</div>
            <p className="text-xs text-slate-500">Automation rules running</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Events Processed
            </CardTitle>
            <Activity className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.eventsProcessed}</div>
            <p className="text-xs text-slate-500">In the last 30 days</p>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Auto Replies
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.autoReplies}</div>
            <p className="text-xs text-slate-500">Sent automatically</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Placeholder */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
            <Activity className="h-10 w-10 mb-4 opacity-20" />
            <p className="text-lg font-medium text-slate-400">No activity yet</p>
            <p className="text-sm max-w-sm mt-2">
              Once your rules start triggering, you&apos;ll see a live feed of actions here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
