"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";

export interface TeamMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: "manager" | "viewer";
  joinedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

export interface TeamInvite {
  id: string;
  workspaceId: string;
  email: string;
  role: "manager" | "viewer";
  token: string;
  expiresAt: string;
  createdAt: string;
}

export interface TeamData {
  workspaceId: string | null;
  workspaceName: string | null;
  members: TeamMember[];
  invites: TeamInvite[];
}

export function useTeam() {
  return useQuery<TeamData>({
    queryKey: ["team"],
    queryFn: async () => {
      const { data } = await api.get("/team");
      return data.data;
    },
  });
}

export function useInviteMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ email, role }: { email: string; role: "manager" | "viewer" }) => {
      const { data } = await api.post("/team/invite", { email, role });
      return data.data as TeamInvite;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team"] });
      toast.success("Invite sent!");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error ?? "Failed to send invite");
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (memberId: string) => {
      await api.delete(`/team/members/${memberId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team"] });
      toast.success("Member removed");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error ?? "Failed to remove member");
    },
  });
}

export function useInviteInfo(token: string | undefined) {
  return useQuery({
    queryKey: ["team", "invite", token],
    queryFn: async () => {
      const { data } = await api.get(`/team/invites/${token}`);
      return data.data as {
        email: string;
        role: string;
        workspaceName: string;
        ownerName: string | null;
        ownerEmail: string;
        expiresAt: string;
      };
    },
    enabled: !!token,
  });
}

export function useAcceptInvite() {
  return useMutation({
    mutationFn: async (token: string) => {
      const { data } = await api.post(`/team/invites/${token}/accept`);
      return data.data as { workspaceOwnerId: string; role: string };
    },
  });
}

export function useSwitchWorkspace() {
  return useMutation({
    mutationFn: async (workspaceOwnerId: string) => {
      const { data } = await api.post("/auth/switch-workspace", { workspaceOwnerId });
      return data.data as { accessToken: string };
    },
  });
}

export interface WorkspaceMembership {
  workspaceId: string;
  workspaceName: string;
  ownerName: string | null;
  ownerEmail: string;
  ownerId: string;
  role: string;
}

export function useMyWorkspaceMemberships() {
  return useQuery<WorkspaceMembership[]>({
    queryKey: ["team", "memberships"],
    queryFn: async () => {
      const { data } = await api.get("/team/memberships");
      return data.data ?? [];
    },
  });
}
