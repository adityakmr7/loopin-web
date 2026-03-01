"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export interface Contact {
  id: string;
  accountId: string;
  instagramUserId: string;
  username: string;
  displayName: string | null;
  profilePictureUrl: string | null;
  email: string | null;
  phone: string | null;
  tags: string[];
  notes: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  interactionCount: number;
}

export interface ContactInteraction {
  id: string;
  contactId: string;
  type: "comment" | "mention" | "dm";
  ruleId: string | null;
  text: string | null;
  mediaId: string | null;
  occurredAt: string;
}

export interface ContactsFilters {
  search?: string;
  tag?: string;
  page?: number;
  limit?: number;
}

export function useContacts(accountId: string | undefined, filters: ContactsFilters = {}) {
  return useQuery({
    queryKey: ["contacts", accountId, filters],
    queryFn: async () => {
      const params = new URLSearchParams({ accountId: accountId! });
      if (filters.search) params.set("search", filters.search);
      if (filters.tag) params.set("tag", filters.tag);
      if (filters.page) params.set("page", String(filters.page));
      if (filters.limit) params.set("limit", String(filters.limit));

      const { data } = await api.get(`/contacts?${params}`);
      return data as { data: Contact[]; pagination: { page: number; limit: number; total: number; totalPages: number } };
    },
    enabled: !!accountId,
  });
}

export function useContact(contactId: string | undefined) {
  return useQuery<Contact>({
    queryKey: ["contacts", "detail", contactId],
    queryFn: async () => {
      const { data } = await api.get(`/contacts/${contactId}`);
      return data.data;
    },
    enabled: !!contactId,
  });
}

export function useContactInteractions(contactId: string | undefined) {
  return useQuery<ContactInteraction[]>({
    queryKey: ["contacts", "interactions", contactId],
    queryFn: async () => {
      const { data } = await api.get(`/contacts/${contactId}/interactions`);
      return data.data;
    },
    enabled: !!contactId,
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Pick<Contact, "email" | "phone" | "tags" | "notes">> }) => {
      const { data } = await api.patch(`/contacts/${id}`, patch);
      return data.data as Contact;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["contacts", "detail", updated.id], updated);
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contactId: string) => {
      await api.delete(`/contacts/${contactId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}
