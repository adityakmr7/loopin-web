"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Zap, Instagram, Loader2, ShieldCheck, Eye, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import api from "@/lib/api";
import { toast } from "sonner";
import { AxiosError } from "axios";

const TRUST_ITEMS = [
  { icon: ShieldCheck, text: "Secure OAuth — we never see your password" },
  { icon: Eye,         text: "Read your profile and receive messages" },
  { icon: Unlock,      text: "Revoke access from Instagram at any time" },
];

export default function OnboardingPage() {
  const router = useRouter();

  // Redirect to login if not authenticated
  const { isLoading: authLoading, isAuthenticated } = useAuth(false, true);

  // Check if already has an Instagram account
  const { data: accounts, isLoading: accountsLoading } = useQuery<any[]>({
    queryKey: ["instagram", "accounts"],
    queryFn: async () => {
      const { data } = await api.get("/instagram/accounts");
      return data.data || [];
    },
    enabled: isAuthenticated,
  });

  // If already connected, skip straight to dashboard
  useEffect(() => {
    if (!accountsLoading && accounts && accounts.length > 0) {
      router.replace("/dashboard");
    }
  }, [accounts, accountsLoading, router]);

  const connectMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.get("/instagram/auth");
      return data.data;
    },
    onSuccess: (data) => {
      window.location.href = data.authorizationUrl;
    },
    onError: (error: AxiosError<{ error: string }>) => {
      toast.error("Could not start Instagram connection", {
        description: error.response?.data?.error || "Please try again",
      });
    },
  });

  const isLoading = authLoading || accountsLoading;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Top bar */}
      <header className="flex items-center gap-2.5 px-8 py-5">
        <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <span className="font-bold text-white text-lg">Loopin</span>
      </header>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8">
            <div className="flex items-center gap-1.5">
              <div className="h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center text-[11px] font-bold text-white">1</div>
              <span className="text-xs font-medium text-indigo-400">Connect Instagram</span>
            </div>
            <div className="h-px flex-1 bg-slate-800" />
            <div className="flex items-center gap-1.5">
              <div className="h-6 w-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[11px] font-medium text-slate-500">2</div>
              <span className="text-xs text-slate-500">Create automation</span>
            </div>
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 space-y-7">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center shadow-lg shadow-pink-500/20">
                <Instagram className="h-10 w-10 text-white" />
              </div>
            </div>

            {/* Headline */}
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-slate-100">
                Connect your Instagram
              </h1>
              <p className="text-slate-400 text-sm leading-relaxed">
                Link your Instagram Business or Creator account to start automating replies, DMs, and more.
              </p>
            </div>

            {/* CTA */}
            <Button
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white h-12 text-base font-medium gap-2.5"
              onClick={() => connectMutation.mutate()}
              disabled={connectMutation.isPending}
            >
              {connectMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Instagram className="h-5 w-5" />
              )}
              {connectMutation.isPending ? "Redirecting…" : "Connect Instagram"}
            </Button>

            {/* Trust items */}
            <div className="space-y-2.5 pt-1">
              {TRUST_ITEMS.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2.5 text-xs text-slate-500">
                  <Icon className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                  {text}
                </div>
              ))}
            </div>
          </div>

          <p className="mt-5 text-center text-xs text-slate-600">
            Already connected?{" "}
            <button
              className="text-slate-400 hover:text-slate-300 underline underline-offset-2"
              onClick={() => router.push("/dashboard")}
            >
              Go to dashboard
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
