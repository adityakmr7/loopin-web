"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useForm, FieldValues } from "react-hook-form";
import { toast } from "sonner";
import { Loader2, Zap, MessageSquare, Users, BarChart2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

const FEATURES = [
  { icon: MessageSquare, text: "Auto-reply to comments with smart keyword rules" },
  { icon: Users, text: "Build and manage your Instagram contact database" },
  { icon: BarChart2, text: "Track every interaction with real-time analytics" },
];

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useAuth(true);

  const { register, handleSubmit } = useForm();

  useEffect(() => {
    if (shouldRedirect) {
      window.location.href = "/dashboard";
    }
  }, [shouldRedirect]);

  const onSubmit = async (data: FieldValues) => {
    setLoading(true);
    try {
      const response = await api.post("/auth/login", data);
      if (response.data?.data?.tokens?.accessToken) {
        localStorage.setItem("accessToken", response.data.data.tokens.accessToken);
      }
      if (response.data?.data?.tokens?.refreshToken) {
        localStorage.setItem("refreshToken", response.data.data.tokens.refreshToken);
      }
      toast.success("Welcome back!");
      setShouldRedirect(true);
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "response" in error &&
        error.response && typeof error.response === "object" && "data" in error.response &&
        error.response.data && typeof error.response.data === "object" && "error" in error.response.data
          ? String((error.response.data as { error: unknown }).error)
          : "Please check your credentials";
      toast.error("Login failed", { description: errorMessage });
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* ── Left branding panel ─────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col justify-between p-12 bg-slate-950">
        {/* Background gradient orbs */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/60 via-slate-950 to-slate-950" />
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-0 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        {/* Subtle dot grid */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "radial-gradient(circle, #818cf8 1px, transparent 1px)", backgroundSize: "28px 28px" }}
        />

        {/* Logo */}
        <div className="relative flex items-center gap-2.5 text-2xl font-bold text-white">
          <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Zap className="h-5 w-5 text-white" />
          </div>
          Loopin
        </div>

        {/* Headline + features */}
        <div className="relative space-y-8">
          <div>
            <h2 className="text-4xl font-bold text-white leading-snug">
              Automate your Instagram.<br />
              <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                Grow on autopilot.
              </span>
            </h2>
            <p className="mt-4 text-slate-400 text-lg leading-relaxed">
              Reply to comments, send DMs, and capture leads — automatically, 24/7.
            </p>
          </div>

          <div className="space-y-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-indigo-400" />
                </div>
                <span className="text-slate-300 text-sm">{text}</span>
              </div>
            ))}
          </div>

          {/* Social proof pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span className="text-sm text-emerald-300">Trusted by Instagram creators & agencies</span>
          </div>
        </div>

        <div className="relative text-xs text-slate-700">
          © 2026 Loopin · All rights reserved
        </div>
      </div>

      {/* ── Right form panel ────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center bg-slate-950 border-l border-slate-800/60 p-8">
        <div className="w-full max-w-sm">
          {/* Mobile-only logo */}
          <div className="lg:hidden flex items-center gap-2 font-bold text-white text-xl mb-10">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            Loopin
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">Welcome back</h1>
            <p className="text-slate-400 mt-1">Sign in to your Loopin account</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                required
                className="bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-600 focus-visible:ring-indigo-500/50 h-11"
                {...register("email", { required: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                className="bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-600 focus-visible:ring-indigo-500/50 h-11"
                {...register("password", { required: true })}
              />
            </div>

            <Button
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white h-11 font-medium transition-colors"
              type="submit"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Start for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
