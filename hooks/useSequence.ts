"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export interface SequenceStep {
  id: string;
  sequenceId: string;
  stepNumber: number;
  delayDays: number;
  message: string;
  createdAt: string;
  updatedAt: string;
}

export interface Sequence {
  id: string;
  userId: string;
  accountId: string;
  name: string;
  description: string | null;
  trigger: "comment" | "mention" | "message";
  conditions: { text_contains: string[] };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  steps: SequenceStep[];
  activeEnrollments?: number;
  completedEnrollments?: number;
  totalEnrollments?: number;
  _count?: { enrollments: number };
}

export interface SequenceEnrollment {
  id: string;
  sequenceId: string;
  contactId: string;
  currentStep: number;
  status: "active" | "completed" | "stopped";
  nextSendAt: string;
  enrolledAt: string;
  completedAt: string | null;
  contact: {
    username: string;
    displayName: string | null;
    profilePictureUrl: string | null;
  };
}

export function useSequences(accountId: string | undefined) {
  return useQuery({
    queryKey: ["sequences", accountId],
    queryFn: async () => {
      const params = accountId ? `?accountId=${accountId}` : "";
      const { data } = await api.get(`/sequences${params}`);
      return data.data as Sequence[];
    },
    enabled: true,
  });
}

export function useSequence(id: string | undefined) {
  return useQuery({
    queryKey: ["sequences", "detail", id],
    queryFn: async () => {
      const { data } = await api.get(`/sequences/${id}`);
      return data.data as Sequence;
    },
    enabled: !!id,
    refetchInterval: (query) => {
      const seq = query.state.data as Sequence | undefined;
      return (seq?.activeEnrollments ?? 0) > 0 ? 10000 : false;
    },
  });
}

export function useSequenceEnrollments(
  id: string | undefined,
  filters: { status?: string; page?: number; limit?: number }
) {
  return useQuery({
    queryKey: ["sequences", "enrollments", id, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.set("status", filters.status);
      params.set("page", String(filters.page ?? 1));
      params.set("limit", String(filters.limit ?? 20));
      const { data } = await api.get(`/sequences/${id}/enrollments?${params}`);
      return data as {
        data: SequenceEnrollment[];
        total: number;
        page: number;
        totalPages: number;
      };
    },
    enabled: !!id,
  });
}

export function useCreateSequence() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (input: {
      accountId: string;
      name: string;
      description?: string;
      trigger: string;
      conditions: { text_contains: string[] };
      steps: { stepNumber: number; delayDays: number; message: string }[];
    }) => {
      const { data } = await api.post("/sequences", input);
      return data.data as Sequence;
    },
    onSuccess: (sequence) => {
      queryClient.invalidateQueries({ queryKey: ["sequences"] });
      router.push(`/sequences/${sequence.id}`);
    },
  });
}

export function useUpdateSequence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<{
        name: string;
        description: string;
        isActive: boolean;
        steps: { stepNumber: number; delayDays: number; message: string }[];
      }>;
    }) => {
      const { data } = await api.patch(`/sequences/${id}`, patch);
      return data.data as Sequence;
    },
    onSuccess: (sequence) => {
      queryClient.invalidateQueries({ queryKey: ["sequences", "detail", sequence.id] });
      queryClient.invalidateQueries({ queryKey: ["sequences"] });
    },
  });
}

export function useDeleteSequence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/sequences/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sequences"] });
    },
  });
}
