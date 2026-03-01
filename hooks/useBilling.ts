"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";

export interface Plan {
  id: string;
  name: "free" | "pro" | "agency";
  maxAccounts: number;
  maxRules: number;
  maxAutomationsPerMonth: number;
  features: string[];
}

export interface SubscriptionData {
  plan: Plan;
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  razorpayCustomerId: string | null;
  usage: {
    automations: number;
    month: string;
  };
}

export function useSubscription() {
  return useQuery<SubscriptionData | null>({
    queryKey: ["billing", "subscription"],
    queryFn: async () => {
      const { data } = await api.get("/billing/subscription");
      return data.data;
    },
  });
}

export function useCreateCheckout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (planId: string) => {
      const { data } = await api.post("/billing/checkout", { planId });
      return data.data as { subscriptionId: string; keyId: string };
    },
    onSuccess: ({ subscriptionId, keyId }) => {
      const options = {
        key: keyId,
        subscription_id: subscriptionId,
        name: "Loopin",
        description: "Subscription",
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_subscription_id: string;
          razorpay_signature: string;
        }) => {
          try {
            await api.post("/billing/verify-payment", {
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySubscriptionId: response.razorpay_subscription_id,
              razorpaySignature: response.razorpay_signature,
            });
            queryClient.invalidateQueries({ queryKey: ["billing", "subscription"] });
            toast.success("Subscription activated!", { description: "Your plan has been upgraded." });
          } catch {
            toast.error("Payment verification failed", { description: "Please contact support." });
          }
        },
        modal: {
          ondismiss: () => {
            toast.info("Payment canceled");
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    },
    onError: () => {
      toast.error("Failed to initiate checkout");
    },
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.delete("/billing/subscription");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing", "subscription"] });
      toast.success("Subscription canceled", {
        description: "You'll retain access until the end of your billing period.",
      });
    },
    onError: () => {
      toast.error("Failed to cancel subscription");
    },
  });
}
