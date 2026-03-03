"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users2, UserPlus, Copy, Trash2, Loader2, Clock, Crown, Eye, Shield } from "lucide-react";
import { useTeam, useInviteMember, useRemoveMember } from "@/hooks/useTeam";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { FeatureGate } from "@/components/ui/feature-gate";

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={cn(
      "text-xs px-2 py-0.5 rounded-full border font-medium",
      role === "manager"
        ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
        : "bg-slate-700/50 text-slate-400 border-slate-700"
    )}>
      {role === "manager" ? <span className="flex items-center gap-1"><Shield className="h-2.5 w-2.5" /> Manager</span> : <span className="flex items-center gap-1"><Eye className="h-2.5 w-2.5" /> Viewer</span>}
    </span>
  );
}

export default function TeamPage() {
  const { data, isLoading } = useTeam();
  const inviteMutation = useInviteMember();
  const removeMutation = useRemoveMember();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"manager" | "viewer">("viewer");

  const handleInvite = async () => {
    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }
    await inviteMutation.mutateAsync({ email: email.trim(), role });
    setEmail("");
  };

  const copyInviteLink = (token: string) => {
    const url = `${window.location.origin}/team/invite/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Invite link copied!");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <FeatureGate plan="agency" mode="page" label="Team">
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Team</h1>
        <p className="text-slate-400 mt-1">Invite teammates to collaborate on your workspace</p>
      </div>

      {/* Invite form */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
        <div>
          <p className="text-base font-semibold text-slate-100">Invite a Teammate</p>
          <div className="h-px bg-slate-800 mt-3 mb-4" />
        </div>
        <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-end">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              placeholder="teammate@company.com"
              className="bg-slate-950 border-slate-800"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleInvite()}
            />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as "manager" | "viewer")}>
              <SelectTrigger className="bg-slate-950 border-slate-800 w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            className="bg-indigo-600 hover:bg-indigo-500 text-white"
            onClick={handleInvite}
            disabled={inviteMutation.isPending}
          >
            {inviteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            <span className="ml-2">Send Invite</span>
          </Button>
        </div>
        <p className="text-xs text-slate-500">
          <strong className="text-slate-400">Manager</strong> — can view and manage automations, contacts, inbox, broadcasts.<br />
          <strong className="text-slate-400">Viewer</strong> — read-only access to analytics and contacts.
        </p>
      </div>

      {/* Members */}
      <div className="rounded-xl border border-slate-800 bg-slate-900">
        <div className="px-6 pt-6 pb-4">
          <p className="text-base font-semibold text-slate-100">Members</p>
          <div className="h-px bg-slate-800 mt-3" />
        </div>

        {(!data?.members || data.members.length === 0) ? (
          <div className="px-6 pb-6">
            <div className="rounded-xl border border-dashed border-slate-800 p-8 flex flex-col items-center justify-center gap-3 text-center">
              <div className="h-14 w-14 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center">
                <Users2 className="h-6 w-6 text-indigo-400" />
              </div>
              <div>
                <p className="font-medium text-slate-300">No teammates yet</p>
                <p className="text-sm text-slate-500 mt-0.5">Invite people above to collaborate</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {/* Owner row */}
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-400">
                  You
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">You (Owner)</p>
                </div>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full border bg-amber-500/10 text-amber-400 border-amber-500/20 flex items-center gap-1">
                <Crown className="h-2.5 w-2.5" /> Owner
              </span>
            </div>

            {data.members.map((member) => {
              const initials = member.user.name
                ? member.user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
                : member.user.email.slice(0, 2).toUpperCase();
              return (
                <div key={member.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400">
                      {initials}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200">{member.user.name ?? member.user.email}</p>
                      {member.user.name && <p className="text-xs text-slate-500">{member.user.email}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <RoleBadge role={member.role} />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-500 hover:text-red-400 hover:bg-red-400/10"
                      onClick={() => removeMutation.mutate(member.id)}
                      disabled={removeMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pending invites */}
      {data?.invites && data.invites.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900">
          <div className="px-6 pt-6 pb-4">
            <p className="text-base font-semibold text-slate-100">Pending Invites</p>
            <div className="h-px bg-slate-800 mt-3" />
          </div>
          <div className="divide-y divide-slate-800">
            {data.invites.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-slate-800 border border-dashed border-slate-700 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-300">{invite.email}</p>
                    <p className="text-xs text-slate-500">
                      Expires {new Date(invite.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <RoleBadge role={invite.role} />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-indigo-400 gap-1.5"
                    onClick={() => copyInviteLink(invite.token)}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy Link
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
    </FeatureGate>
  );
}
