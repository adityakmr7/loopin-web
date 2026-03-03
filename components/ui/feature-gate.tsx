"use client";

import { Lock, Sparkles, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useFeatureAccess, type PlanName } from "@/hooks/useFeatureAccess";

const PLAN_LABEL: Record<PlanName, string> = {
  free: "Free",
  pro: "Pro",
  agency: "Agency",
};

interface FeatureGateProps {
  /** Children to render when access is granted */
  children: React.ReactNode;
  /** Minimum plan required */
  plan: PlanName;
  /** Human-readable feature name shown in the upgrade prompt */
  label?: string;
  /**
   * "inline"  — wraps children with a lock overlay (default).
   *             Use for buttons, cards, or small elements.
   * "page"    — replaces the entire content with a full upgrade card.
   *             Use at the top of a page component.
   */
  mode?: "inline" | "page";
}

export function FeatureGate({
  children,
  plan,
  label,
  mode = "inline",
}: FeatureGateProps) {
  const { canAccess, isLoading } = useFeatureAccess();
  const router = useRouter();

  // While loading, render children normally to avoid layout shift
  if (isLoading || canAccess(plan)) return <>{children}</>;

  const planLabel = PLAN_LABEL[plan];
  const featureLabel = label ?? "this feature";

  function handleUpgradeClick() {
    router.push("/billing");
  }

  // ── Page mode ─────────────────────────────────────────────────────────────
  if (mode === "page") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[420px] py-16">
        <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/50 p-10 flex flex-col items-center text-center max-w-md w-full">
          <div className="h-14 w-14 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-5">
            <Lock className="h-6 w-6 text-indigo-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-100 mb-2">
            {label ? `${label} requires ${planLabel}` : `${planLabel} plan required`}
          </h3>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            Upgrade to the <span className="text-slate-200 font-medium">{planLabel}</span> plan to
            unlock {featureLabel} and more powerful features.
          </p>
          <Button
            onClick={handleUpgradeClick}
            className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Upgrade to {planLabel}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // ── Inline mode ───────────────────────────────────────────────────────────
  return (
    <div
      className="relative group cursor-pointer"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toast.info(`Upgrade to ${planLabel} to unlock ${featureLabel}`, {
          action: {
            label: "Upgrade",
            onClick: handleUpgradeClick,
          },
        });
      }}
    >
      {/* Dimmed children — not interactive */}
      <div className={cn("pointer-events-none select-none opacity-50")}>
        {children}
      </div>

      {/* Lock badge — visible on hover */}
      <div className="absolute inset-0 flex items-center justify-center rounded-lg transition-opacity opacity-0 group-hover:opacity-100 bg-slate-950/30">
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-full px-2.5 py-1 shadow-lg">
          <Lock className="h-3 w-3 text-slate-300" />
          <span className="text-[11px] font-medium text-slate-300">{planLabel}</span>
        </div>
      </div>
    </div>
  );
}
