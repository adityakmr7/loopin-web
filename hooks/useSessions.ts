"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export interface Session {
  id: string;
  createdAt: string;
  expiresAt: string;
  userAgent?: string;
}

export function useSessions() {
  return useQuery<Session[]>({
    queryKey: ["sessions"],
    queryFn: async () => {
      const { data } = await api.get("/auth/sessions");
      return data.data ?? [];
    },
  });
}

export function useRevokeSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      await api.delete(`/auth/sessions/${sessionId}`);
      return sessionId;
    },
    onSuccess: (sessionId) => {
      queryClient.setQueryData<Session[]>(["sessions"], (prev) =>
        prev ? prev.filter((s) => s.id !== sessionId) : []
      );
    },
  });
}

export function useLogoutAllSessions() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.delete("/auth/sessions");
    },
    onSuccess: () => {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      queryClient.clear();
      router.push("/login");
    },
  });
}
