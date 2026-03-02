"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, Users2 } from "lucide-react";
import { useInviteInfo, useAcceptInvite } from "@/hooks/useTeam";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import Link from "next/link";

export default function InviteAcceptPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const { user } = useAuth();
  const { data: invite, isLoading, error } = useInviteInfo(token);
  const acceptMutation = useAcceptInvite();
  const [accepted, setAccepted] = useState(false);

  const handleAccept = async () => {
    if (!user) {
      toast.error("You must be logged in to accept an invite");
      router.push(`/login?redirect=/team/invite/${token}`);
      return;
    }
    try {
      await acceptMutation.mutateAsync(token);
      setAccepted(true);
      toast.success("You've joined the workspace!");
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "Failed to accept invite");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-xl border border-red-900/50 bg-slate-900 p-8 text-center space-y-4">
          <div className="h-14 w-14 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
            <XCircle className="h-7 w-7 text-red-400" />
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-100">Invalid or Expired Invite</p>
            <p className="text-sm text-slate-400 mt-1">This invite link is no longer valid. Please ask for a new one.</p>
          </div>
          <Link href="/dashboard">
            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white">Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-xl border border-emerald-900/50 bg-slate-900 p-8 text-center space-y-4">
          <div className="h-14 w-14 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-7 w-7 text-emerald-400" />
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-100">Welcome to {invite.workspaceName}!</p>
            <p className="text-sm text-slate-400 mt-1">You've joined as a <strong className="text-slate-300">{invite.role}</strong>. You can now switch to this workspace from the sidebar.</p>
          </div>
          <Link href="/dashboard">
            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white">Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full rounded-xl border border-slate-800 bg-slate-900 p-8 space-y-6">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Users2 className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-lg text-white">Loopin</span>
        </div>

        <div className="space-y-2">
          <p className="text-xl font-semibold text-slate-100">You've been invited!</p>
          <p className="text-sm text-slate-400">
            <strong className="text-slate-300">{invite.ownerName ?? invite.ownerEmail}</strong> has invited you to join{" "}
            <strong className="text-slate-300">{invite.workspaceName}</strong> as a{" "}
            <strong className="text-slate-300">{invite.role}</strong>.
          </p>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Workspace</span>
            <span className="text-slate-300">{invite.workspaceName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Your role</span>
            <span className="text-slate-300 capitalize">{invite.role}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Invited email</span>
            <span className="text-slate-300">{invite.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Expires</span>
            <span className="text-slate-300">{new Date(invite.expiresAt).toLocaleDateString()}</span>
          </div>
        </div>

        {!user && (
          <div className="rounded-lg border border-amber-800/50 bg-amber-950/20 px-4 py-3 text-sm text-amber-300">
            You need to be logged in as <strong>{invite.email}</strong> to accept this invite.
          </div>
        )}

        <div className="flex gap-3">
          <Button
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white"
            onClick={handleAccept}
            disabled={acceptMutation.isPending}
          >
            {acceptMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Accept Invite
          </Button>
          <Link href="/dashboard" className="flex-1">
            <Button variant="ghost" className="w-full text-slate-400">Decline</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
