"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
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
      const refreshToken = localStorage.getItem("refreshToken");
      await api.post("/auth/logout", { refreshToken });
    } catch (error) {
      // Proceed with client-side cleanup even if the server call fails
      console.error("Logout request failed:", error);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      queryClient.setQueryData(["auth", "user"], null);
      queryClient.clear();
      router.push("/login");
    }
  };
}
