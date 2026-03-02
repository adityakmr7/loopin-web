"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useSubscription, useCreateCheckout, useCancelSubscription } from "@/hooks/useBilling";
import { format, parseISO } from "date-fns";
import { Check, CreditCard, Loader2, Zap, Building2, Sparkles, AlertTriangle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    name: "free" as const,
    label: "Free",
    price: "₹0",
    period: "forever",
    icon: Zap,
    accentFrom: "from-slate-500",
    accentTo: "to-slate-600",
    iconColor: "text-slate-400",
    iconBg: "bg-slate-500/10",
    features: [
      "1 Instagram account",
      "3 automation rules",
      "500 automations / month",
      "Basic analytics",
    ],
  },
  {
    name: "pro" as const,
    label: "Pro",
    price: "₹799",
    period: "/ month",
    icon: Sparkles,
    accentFrom: "from-indigo-500",
    accentTo: "to-violet-500",
    iconColor: "text-indigo-400",
    iconBg: "bg-indigo-500/10",
    highlight: true,
    features: [
      "5 Instagram accounts",
      "Unlimited rules",
      "10,000 automations / month",
      "DM Inbox + Contacts",
      "Template variables",
      "Advanced analytics",
    ],
  },
  {
    name: "agency" as const,
    label: "Agency",
    price: "₹1,999",
    period: "/ month",
    icon: Building2,
    accentFrom: "from-purple-500",
    accentTo: "to-pink-500",
    iconColor: "text-purple-400",
    iconBg: "bg-purple-500/10",
    features: [
      "Unlimited accounts",
      "Unlimited rules",
      "Unlimited automations",
      "Everything in Pro",
      "Team seats",
      "Priority support",
    ],
  },
];

function UsageBar({ used, max, label }: { used: number; max: number; label: string }) {
  const unlimited = max === -1;
  const pct = unlimited ? 0 : Math.min((used / max) * 100, 100);
  const color = pct > 90 ? "bg-red-500" : pct > 70 ? "bg-amber-500" : "bg-indigo-500";

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-300 font-medium tabular-nums">
          {used.toLocaleString()}
          {unlimited ? (
            <span className="text-slate-500 font-normal"> · unlimited</span>
          ) : (
            <span className="text-slate-500 font-normal"> / {max.toLocaleString()}</span>
          )}
        </span>
      </div>
      {!unlimited && (
        <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
          <div className={cn("h-full rounded-full transition-all duration-500", color)} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}

export default function BillingPage() {
  const { data: subscription, isLoading } = useSubscription();
  const createCheckout = useCreateCheckout();
  const cancelSubscription = useCancelSubscription();

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  const currentPlanName = subscription?.plan.name ?? "free";
  const isPaid = currentPlanName !== "free";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
        <p className="text-slate-400 mt-1">Manage your plan and usage</p>
      </div>

      {/* ── Current plan card ───────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Current Plan</p>
            <p className="text-lg font-semibold text-slate-100 capitalize">{currentPlanName}</p>
          </div>
          <span className={cn(
            "text-xs px-3 py-1.5 rounded-full border font-medium capitalize",
            currentPlanName === "free"
              ? "bg-slate-800 border-slate-700 text-slate-400"
              : currentPlanName === "pro"
              ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
              : "bg-purple-500/10 border-purple-500/30 text-purple-400"
          )}>
            {currentPlanName}
          </span>
        </div>

        {subscription && (
          <div className="space-y-4">
            <UsageBar
              used={subscription.usage.automations}
              max={subscription.plan.maxAutomationsPerMonth}
              label="Automations this month"
            />

            {subscription.currentPeriodEnd && (
              <p className="text-xs text-slate-500">
                {subscription.cancelAtPeriodEnd
                  ? `Cancels ${format(parseISO(subscription.currentPeriodEnd), "MMMM d, yyyy")}`
                  : `Renews ${format(parseISO(subscription.currentPeriodEnd), "MMMM d, yyyy")}`}
              </p>
            )}

            {subscription.status === "past_due" && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Payment failed — your subscription is past due.
              </div>
            )}

            {isPaid && !subscription?.cancelAtPeriodEnd && (
              <Button
                variant="outline"
                size="sm"
                className="border-slate-700 hover:bg-slate-800 gap-2 text-slate-400 hover:text-red-400 hover:border-red-500/30"
                onClick={() => cancelSubscription.mutate()}
                disabled={cancelSubscription.isPending}
              >
                {cancelSubscription.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CreditCard className="h-3.5 w-3.5" />
                )}
                Cancel subscription
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ── Plan cards ──────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-semibold text-slate-300 mb-4">Available plans</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {PLANS.map((plan) => {
            const isCurrent = currentPlanName === plan.name;
            const Icon = plan.icon;

            return (
              <div
                key={plan.name}
                className={cn(
                  "relative rounded-xl border bg-slate-900 overflow-hidden flex flex-col transition-all",
                  plan.highlight
                    ? "border-indigo-500/50 shadow-xl shadow-indigo-500/10"
                    : "border-slate-800 hover:border-slate-700",
                  isCurrent && !plan.highlight && "border-slate-700"
                )}
              >
                {/* Gradient accent bar */}
                <div className={cn("h-0.5 w-full bg-gradient-to-r", plan.accentFrom, plan.accentTo)} />

                {plan.highlight && (
                  <div className="absolute top-3 right-3">
                    <span className="text-[10px] px-2.5 py-1 rounded-full bg-indigo-600 text-white font-semibold tracking-wide uppercase">
                      Popular
                    </span>
                  </div>
                )}

                <div className="p-6 flex flex-col flex-1">
                  {/* Plan header */}
                  <div className="mb-5">
                    <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center mb-4", plan.iconBg)}>
                      <Icon className={cn("h-4.5 w-4.5", plan.iconColor)} />
                    </div>
                    <p className="font-semibold text-slate-100">{plan.label}</p>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-3xl font-bold text-slate-50">{plan.price}</span>
                      <span className="text-slate-500 text-sm">{plan.period}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2.5 flex-1 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
                        <Check className={cn("h-4 w-4 shrink-0 mt-0.5", plan.iconColor)} />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  {isCurrent ? (
                    <div className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-slate-700 text-sm text-slate-500">
                      <Check className="h-4 w-4" />
                      Current plan
                    </div>
                  ) : plan.name === "free" ? (
                    <Button disabled className="w-full" variant="ghost">
                      Downgrade
                    </Button>
                  ) : (
                    <Button
                      className={cn(
                        "w-full gap-2 font-medium",
                        plan.highlight
                          ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                          : "bg-purple-600 hover:bg-purple-500 text-white"
                      )}
                      onClick={() => createCheckout.mutate(plan.name as "pro" | "agency")}
                      disabled={createCheckout.isPending}
                    >
                      {createCheckout.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          Upgrade to {plan.label}
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
