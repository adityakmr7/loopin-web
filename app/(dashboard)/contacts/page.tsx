"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useContacts } from "@/hooks/useContacts";
import api from "@/lib/api";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Users, Search, Download, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Account {
  id: string;
  username: string;
}

const INTERACTION_TYPE_COLORS: Record<string, string> = {
  comment: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  mention: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  dm: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

export default function ContactsPage() {
  const router = useRouter();
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data: accounts } = useQuery<Account[]>({
    queryKey: ["instagram", "accounts"],
    queryFn: async () => {
      const { data } = await api.get("/instagram/accounts");
      return data.data || [];
    },
  });

  // Auto-select first account
  const accountId = selectedAccountId || accounts?.[0]?.id;

  const { data, isLoading } = useContacts(accountId, {
    search: debouncedSearch,
    page,
    limit: 20,
  });

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
    // Simple debounce via state
    setTimeout(() => setDebouncedSearch(value), 300);
  };

  const handleExport = () => {
    if (!accountId) return;
    window.open(`/api/contacts/export?accountId=${accountId}`, "_blank");
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
          <p className="text-slate-400">Everyone who has interacted with your account</p>
        </div>
        <Button variant="outline" className="border-slate-700 hover:bg-slate-800 gap-2" onClick={handleExport} disabled={!accountId}>
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        {accounts && accounts.length > 1 && (
          <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
            <SelectTrigger className="w-48 bg-slate-900 border-slate-800">
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((acc) => (
                <SelectItem key={acc.id} value={acc.id}>@{acc.username}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search by username, name, or email..."
            className="pl-9 bg-slate-900 border-slate-800"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Stats bar */}
      {data && (
        <p className="text-sm text-slate-500">
          {data.pagination.total} contact{data.pagination.total !== 1 ? "s" : ""}
          {debouncedSearch && ` matching "${debouncedSearch}"`}
        </p>
      )}

      {/* Contact table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          ) : !accountId ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="h-10 w-10 mb-4 text-slate-700" />
              <p className="text-base font-medium text-slate-400">No account connected</p>
              <p className="text-sm text-slate-600 mt-1">Connect an Instagram account first</p>
            </div>
          ) : data?.data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="h-10 w-10 mb-4 text-slate-700" />
              <p className="text-base font-medium text-slate-400">No contacts yet</p>
              <p className="text-sm text-slate-600 max-w-sm mt-1">Contacts are created automatically when someone comments, mentions, or DMs your account</p>
            </div>
          ) : (
            <>
              {/* Table header */}
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-6 py-3 text-xs uppercase text-slate-500 border-b border-slate-800">
                <span>Contact</span>
                <span>Last seen</span>
                <span>Interactions</span>
                <span>Tags</span>
              </div>

              {/* Rows */}
              <div className="divide-y divide-slate-800">
                {data?.data.map((contact) => (
                  <button
                    key={contact.id}
                    className="w-full grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-6 py-4 text-left hover:bg-slate-800/50 transition-colors"
                    onClick={() => router.push(`/contacts/${contact.id}`)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {contact.profilePictureUrl ? (
                        <img src={contact.profilePictureUrl} alt="" className="h-8 w-8 rounded-full shrink-0 object-cover" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-slate-700 shrink-0 flex items-center justify-center text-xs text-slate-400">
                          {contact.username[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-100 truncate">
                          {contact.displayName ?? `@${contact.username}`}
                        </p>
                        {contact.displayName && (
                          <p className="text-xs text-slate-500 truncate">@{contact.username}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center">
                      <span className="text-sm text-slate-400">
                        {formatDistanceToNow(parseISO(contact.lastSeenAt), { addSuffix: true })}
                      </span>
                    </div>

                    <div className="flex items-center">
                      <span className="text-sm text-slate-300">{contact.interactionCount}</span>
                    </div>

                    <div className="flex items-center gap-1 flex-wrap">
                      {contact.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                          {tag}
                        </span>
                      ))}
                      {contact.tags.length > 2 && (
                        <span className="text-xs text-slate-500">+{contact.tags.length - 2}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Pagination */}
              {data && data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800">
                  <span className="text-sm text-slate-500">
                    Page {data.pagination.page} of {data.pagination.totalPages}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-slate-700"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-slate-700"
                      disabled={page >= data.pagination.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
      </div>
    </div>
  );
}
