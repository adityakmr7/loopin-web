"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useForm, FieldValues } from "react-hook-form";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  
  // Redirect if already logged in
  useAuth(true);

  const { register, handleSubmit } = useForm();

  // Handle redirect after successful login
  useEffect(() => {
    if (shouldRedirect) {
      window.location.href = "/dashboard";
    }
  }, [shouldRedirect]);

  const onSubmit = async (data: FieldValues) => {
    setLoading(true);
    try {
      const response = await api.post("/auth/login", data);
      
      // Save tokens to localStorage
      // API response structure: response.data.data.tokens
      if (response.data?.data?.tokens?.accessToken) {
        localStorage.setItem("accessToken", response.data.data.tokens.accessToken);
      }
      if (response.data?.data?.tokens?.refreshToken) {
        localStorage.setItem("refreshToken", response.data.data.tokens.refreshToken);
      }
      
      toast.success("Welcome back!", {
        description: "Redirecting to dashboard...",
      });
      
      // Trigger redirect
      setShouldRedirect(true);
    } catch (error: unknown) {
      const errorMessage = 
        error && typeof error === 'object' && 'response' in error && 
        error.response && typeof error.response === 'object' && 'data' in error.response &&
        error.response.data && typeof error.response.data === 'object' && 'error' in error.response.data
          ? String(error.response.data.error)
          : "Please check your credentials";
      
      toast.error("Login failed", {
        description: errorMessage,
      });
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <Card className="w-full max-w-md border-slate-800 bg-slate-900 text-slate-50">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Login to Loopin
          </CardTitle>
          <CardDescription className="text-slate-400">
            Enter your email and password to access your dashboard
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                className="bg-slate-950 border-slate-800"
                {...register("email", { required: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                className="bg-slate-950 border-slate-800"
                {...register("password", { required: true })}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 mt-4">
            <Button 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" 
              type="submit"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
            <div className="text-center text-sm text-slate-400">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-indigo-400 hover:text-indigo-300">
                Register
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
