"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Zap,
  BarChart2,
  Settings,
  LogOut,
  Instagram,
  Users,
  Users2,
  MessageSquare,
  CreditCard,
  Radio,
  MessageCirclePlus,
  Activity,
  GitBranch,
  Webhook,
  ChevronDown,
  Check,
} from "lucide-react";
import { useLogout, useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { FeedbackModal } from "@/components/layout/FeedbackModal";
import { useMyWorkspaceMemberships, useSwitchWorkspace } from "@/hooks/useTeam";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const sidebarItems = [
  { title: "Overview",   href: "/dashboard",  icon: LayoutDashboard },
  { title: "Analytics",  href: "/analytics",  icon: BarChart2 },
  { title: "Automation", href: "/automation", icon: Zap },
  { title: "Sequences",  href: "/sequences",  icon: GitBranch },
  { title: "Activity",   href: "/activity",   icon: Activity },
  { title: "Contacts",   href: "/contacts",   icon: Users },
  { title: "Inbox",      href: "/inbox",      icon: MessageSquare },
  { title: "Broadcasts", href: "/broadcasts", icon: Radio },
  { title: "Team",       href: "/team",       icon: Users2 },
  { title: "Webhooks",   href: "/webhooks",   icon: Webhook },
  { title: "Accounts",   href: "/accounts",   icon: Instagram },
  { title: "Billing",    href: "/billing",    icon: CreditCard },
  { title: "Settings",   href: "/settings",   icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useLogout();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [workspaceSwitcherOpen, setWorkspaceSwitcherOpen] = useState(false);

  const { data: memberships = [] } = useMyWorkspaceMemberships();
  const switchWorkspaceMutation = useSwitchWorkspace();

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  const handleSwitchWorkspace = async (workspaceOwnerId: string) => {
    try {
      const { accessToken } = await switchWorkspaceMutation.mutateAsync(workspaceOwnerId);
      localStorage.setItem("accessToken", accessToken);
      queryClient.clear();
      setWorkspaceSwitcherOpen(false);
      toast.success("Switched workspace");
      router.push("/dashboard");
    } catch {
      toast.error("Failed to switch workspace");
    }
  };

  const handleSwitchToOwn = () => {
    // Re-login to restore own token — simplest: logout and redirect
    toast.info("Please log in again to return to your own workspace");
    logout();
  };

  return (
    <>
      <div className="flex h-screen w-64 flex-col border-r border-slate-800 bg-slate-950">
        <div className="flex h-16 items-center px-5 border-b border-slate-800">
          <Link href="/dashboard" className="flex items-center gap-2.5 font-bold text-lg text-white">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span>Loopin</span>
          </Link>
        </div>

        <div className="flex-1 flex flex-col justify-between p-4">
          <nav className="space-y-2">
            {sidebarItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  pathname === item.href || pathname.startsWith(`${item.href}/`)
                    ? "bg-indigo-600/10 text-indigo-400"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.title}
              </Link>
            ))}
          </nav>

          <div className="space-y-1">
            {/* User identity + workspace switcher */}
            {user && (
              <div className="mb-1 relative">
                <button
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-900 transition-colors"
                  onClick={() => memberships.length > 0 && setWorkspaceSwitcherOpen((v) => !v)}
                >
                  <div className="h-7 w-7 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-[11px] font-bold text-indigo-400 shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-xs font-medium text-slate-200 truncate">{user.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                  </div>
                  {memberships.length > 0 && (
                    <ChevronDown className={cn("h-3.5 w-3.5 text-slate-500 shrink-0 transition-transform", workspaceSwitcherOpen && "rotate-180")} />
                  )}
                </button>

                {/* Workspace dropdown */}
                {workspaceSwitcherOpen && memberships.length > 0 && (
                  <div className="absolute bottom-full left-0 right-0 mb-1 rounded-lg border border-slate-700 bg-slate-900 shadow-xl z-50 overflow-hidden">
                    <div className="px-3 py-2 border-b border-slate-800">
                      <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Switch Workspace</p>
                    </div>
                    <div
                      className="flex items-center gap-2 px-3 py-2.5 hover:bg-slate-800 cursor-pointer"
                      onClick={() => setWorkspaceSwitcherOpen(false)}
                    >
                      <Check className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-200 truncate">My Workspace</p>
                        <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                      </div>
                    </div>
                    {memberships.map((m) => (
                      <div
                        key={m.workspaceId}
                        className="flex items-center gap-2 px-3 py-2.5 hover:bg-slate-800 cursor-pointer"
                        onClick={() => handleSwitchWorkspace(m.ownerId)}
                      >
                        <div className="h-3.5 w-3.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-200 truncate">{m.workspaceName}</p>
                          <p className="text-[10px] text-slate-500 truncate">{m.ownerEmail} · {m.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <Button
              variant="ghost"
              onClick={() => setFeedbackOpen(true)}
              className="w-full justify-start gap-3 text-slate-400 hover:text-indigo-400 hover:bg-indigo-400/10"
            >
              <MessageCirclePlus className="h-5 w-5" />
              Give Feedback
            </Button>

            <Button
              variant="ghost"
              onClick={() => logout()}
              className="w-full justify-start gap-3 text-slate-400 hover:text-red-400 hover:bg-red-400/10"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <FeedbackModal open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </>
  );
}
