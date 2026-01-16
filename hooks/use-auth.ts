"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { User } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

interface UserProfile {
  id: string;
  email: string;
  name: string;
}

export function useAuth(redirectIfFound = false, redirectIfNotFound = false) {
  const router = useRouter();
  const pathname = usePathname();

  const {
    data: user,
    error,
    isLoading,
    isError,
  } = useQuery<UserProfile>({
    queryKey: ["auth", "user"],
    queryFn: async () => {
      const { data } = await api.get("/auth/me");
      return data.data;
    },
    retry: 0,
  });

  useEffect(() => {
    if (isLoading) return;

    // If no user found and we should redirect
    if (isError || !user) {
      if (redirectIfNotFound && pathname !== "/login" && pathname !== "/register") {
        router.push("/login");
      }
    }

    // If user found and we should redirect (e.g., from login page)
    if (user && redirectIfFound) {
      router.push("/dashboard");
    }
  }, [user, isError, isLoading, redirectIfFound, redirectIfNotFound, router, pathname]);

  return {
    user,
    isLoading,
    isError,
    isAuthenticated: !!user,
  };
}

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return async () => {
    try {
      await api.post("/auth/logout");
      queryClient.setQueryData(["auth", "user"], null);
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };
}

import { useQueryClient } from "@tanstack/react-query";
