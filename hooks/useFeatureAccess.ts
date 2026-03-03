"use client";

import { useSubscription } from "@/hooks/useBilling";

export type PlanName = "free" | "pro" | "agency";

const PLAN_RANK: Record<PlanName, number> = { free: 0, pro: 1, agency: 2 };

export function useFeatureAccess() {
  const { data: subscription } = useSubscription();

  const planName: PlanName = (subscription?.plan.name ?? "free") as PlanName;
  const features: string[] = subscription?.plan.features ?? [];

  /** Check if the user's plan meets or exceeds the required plan */
  function canAccess(requiredPlan: PlanName): boolean {
    return PLAN_RANK[planName] >= PLAN_RANK[requiredPlan];
  }

  /** Check if a named feature flag is enabled on the current plan */
  function hasFeature(feature: string): boolean {
    return features.includes(feature);
  }

  return {
    planName,
    isPro: canAccess("pro"),
    isAgency: canAccess("agency"),
    canAccess,
    hasFeature,
    isLoading: subscription === undefined,
  };
}
