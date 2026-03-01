"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Loader2, Zap, Radio, Activity, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

const HIGHLIGHTS = [
  { icon: Zap, text: "Keyword-triggered auto-replies in seconds" },
  { icon: Radio, text: "Mass DM broadcasts to your entire audience" },
  { icon: Activity, text: "Live activity log for every automation" },
  { icon: Shield, text: "Rate-limit aware — stays within Instagram rules" },
];

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);

  useAuth(true);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const response = await api.post("/auth/register", data);
      if (response.data?.data?.tokens?.accessToken) {
        localStorage.setItem("accessToken", response.data.data.tokens.accessToken);
      }
      if (response.data?.data?.tokens?.refreshToken) {
        localStorage.setItem("refreshToken", response.data.data.tokens.refreshToken);
      }
      toast.success("Account created! Welcome to Loopin.");
      window.location.href = "/dashboard";
    } catch (error: any) {
      toast.error("Registration failed", {
        description: error.response?.data?.error || "Please check your details",
      });
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* ── Left branding panel ─────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col justify-between p-12 bg-slate-950">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/60 via-slate-950 to-slate-950" />
        <div className="absolute top-1/3 -left-16 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-4 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
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

        {/* Content */}
        <div className="relative space-y-8">
          <div>
            <div className="inline-block rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 text-xs text-indigo-400 font-medium mb-4">
              Free plan · No credit card required
            </div>
            <h2 className="text-4xl font-bold text-white leading-snug">
              Set up automation<br />
              <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                in under 2 minutes.
              </span>
            </h2>
            <p className="mt-4 text-slate-400 text-lg leading-relaxed">
              Connect your Instagram account, create your first rule, and watch Loopin handle the rest.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <div key={text} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-2">
                <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                  <Icon className="h-4 w-4 text-indigo-400" />
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">{text}</p>
              </div>
            ))}
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
            <h1 className="text-2xl font-bold text-white">Create your account</h1>
            <p className="text-slate-400 mt-1">Free forever · Upgrade when you&apos;re ready</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-300">Full name</Label>
              <Input
                id="name"
                placeholder="Alex Johnson"
                required
                className="bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-600 focus-visible:ring-indigo-500/50 h-11"
                {...register("name", { required: true })}
              />
            </div>

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
                {...register("password", { required: true, minLength: 6 })}
              />
              {errors.password && (
                <p className="text-xs text-red-400">Password must be at least 6 characters</p>
              )}
            </div>

            <Button
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white h-11 font-medium transition-colors"
              type="submit"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Creating account…" : "Get started for free"}
            </Button>

            <p className="text-center text-[11px] text-slate-600 leading-relaxed">
              By creating an account you agree to our Terms of Service and Privacy Policy.
            </p>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
