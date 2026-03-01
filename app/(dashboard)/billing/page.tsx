"use client";

import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSubscription, useCreateCheckout, useCancelSubscription } from "@/hooks/useBilling";
import { format, parseISO } from "date-fns";
import { Check, CreditCard, Loader2, Zap, Building2, Sparkles, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    name: "free" as const,
    label: "Free",
    price: "₹0",
    period: "forever",
    icon: Zap,
    color: "text-slate-400",
    planId: null,
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
    color: "text-indigo-400",
    planId: process.env.NEXT_PUBLIC_RAZORPAY_PRO_PLAN_ID ?? "",
    features: [
      "5 Instagram accounts",
      "Unlimited rules",
      "10,000 automations / month",
      "DM Inbox + Contacts",
      "Template variables",
      "Advanced analytics",
    ],
    highlight: true,
  },
  {
    name: "agency" as const,
    label: "Agency",
    price: "₹1,999",
    period: "/ month",
    icon: Building2,
    color: "text-purple-400",
    planId: process.env.NEXT_PUBLIC_RAZORPAY_AGENCY_PLAN_ID ?? "",
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
        <span className="text-slate-300 font-medium">
          {used.toLocaleString()} {unlimited ? "" : `/ ${max.toLocaleString()}`}
          {unlimited && <span className="text-slate-500"> (unlimited)</span>}
        </span>
      </div>
      {!unlimited && (
        <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
          <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}

export default function BillingPage() {
  const { data: subscription, isLoading } = useSubscription();
  const createCheckout = useCreateCheckout();
  const cancelSubscription = useCancelSubscription();

  // Load Razorpay checkout.js
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
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
        <p className="text-slate-400">Manage your plan and usage</p>
      </div>

      {/* Current plan + usage */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-medium">Current Plan</CardTitle>
          <span className="text-sm px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 capitalize font-medium">
            {currentPlanName}
          </span>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscription && (
            <>
              <UsageBar
                used={subscription.usage.automations}
                max={subscription.plan.maxAutomationsPerMonth}
                label="Automations this month"
              />

              {subscription.currentPeriodEnd && (
                <p className="text-xs text-slate-500">
                  {subscription.cancelAtPeriodEnd
                    ? `Cancels on ${format(parseISO(subscription.currentPeriodEnd), "MMM d, yyyy")}`
                    : `Renews on ${format(parseISO(subscription.currentPeriodEnd), "MMM d, yyyy")}`}
                </p>
              )}

              {subscription.status === "past_due" && (
                <p className="text-sm text-red-400 font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Payment failed — your subscription is past due
                </p>
              )}
            </>
          )}

          {isPaid && !subscription?.cancelAtPeriodEnd && (
            <Button
              variant="outline"
              className="border-slate-700 hover:bg-slate-800 gap-2 mt-2 text-red-400 hover:text-red-300 hover:border-red-500/30"
              onClick={() => cancelSubscription.mutate()}
              disabled={cancelSubscription.isPending}
            >
              {cancelSubscription.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4" />
              )}
              Cancel Subscription
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Plan cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrent = currentPlanName === plan.name;
          const Icon = plan.icon;

          return (
            <Card
              key={plan.name}
              className={cn(
                "bg-slate-900 border-slate-800 relative",
                plan.highlight && "border-indigo-500/50 shadow-lg shadow-indigo-500/5",
                isCurrent && "ring-1 ring-indigo-500/30"
              )}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="text-xs px-3 py-1 rounded-full bg-indigo-600 text-white font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={cn("h-5 w-5", plan.color)} />
                  <CardTitle className="text-base">{plan.label}</CardTitle>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-slate-500 text-sm">{plan.period}</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                      <Check className="h-4 w-4 text-indigo-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <Button disabled className="w-full border border-slate-700" variant="outline">
                    Current Plan
                  </Button>
                ) : plan.name === "free" ? (
                  <Button disabled className="w-full" variant="ghost">
                    Downgrade
                  </Button>
                ) : (
                  <Button
                    className={cn(
                      "w-full",
                      plan.highlight
                        ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                        : "bg-purple-600 hover:bg-purple-700 text-white"
                    )}
                    onClick={() => plan.planId && createCheckout.mutate(plan.planId)}
                    disabled={createCheckout.isPending || !plan.planId}
                  >
                    {createCheckout.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      `Upgrade to ${plan.label}`
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
