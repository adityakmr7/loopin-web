"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Zap,
  BarChart2,
  Settings,
  LogOut,
  Instagram,
  Users,
  MessageSquare,
  CreditCard,
  Radio,
  MessageCirclePlus,
  Activity,
} from "lucide-react";
import { useLogout, useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { FeedbackModal } from "@/components/layout/FeedbackModal";

const sidebarItems = [
  { title: "Overview",   href: "/dashboard",  icon: LayoutDashboard },
  { title: "Analytics",  href: "/analytics",  icon: BarChart2 },
  { title: "Automation", href: "/automation", icon: Zap },
  { title: "Activity",   href: "/activity",   icon: Activity },
  { title: "Contacts",   href: "/contacts",   icon: Users },
  { title: "Inbox",      href: "/inbox",      icon: MessageSquare },
  { title: "Broadcasts", href: "/broadcasts", icon: Radio },
  { title: "Accounts",   href: "/accounts",   icon: Instagram },
  { title: "Billing",    href: "/billing",    icon: CreditCard },
  { title: "Settings",   href: "/settings",   icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const logout = useLogout();
  const { user } = useAuth();
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

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
            {/* User identity */}
            {user && (
              <div className="flex items-center gap-2.5 px-3 py-2.5 mb-1 rounded-lg border border-slate-800 bg-slate-900/50">
                <div className="h-7 w-7 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-[11px] font-bold text-indigo-400 shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-200 truncate">{user.name}</p>
                  <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                </div>
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
