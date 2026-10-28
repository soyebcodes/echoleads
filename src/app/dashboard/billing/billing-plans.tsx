"use client";

import { useState } from "react";
import { createCheckoutSession, openBillingPortal } from "@/app/actions/billing";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, CreditCard, Loader2 } from "lucide-react";
import type { PlanDefinition } from "@/lib/billing/plans";

type Props = {
  plans: PlanDefinition[];
  currentPlanId: string;
  stripeEnabled: boolean;
  isFree: boolean;
};

export default function BillingPlans({ plans, currentPlanId, stripeEnabled, isFree }: Props) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const handleUpgrade = async (planId: string) => {
    if (!stripeEnabled) {
      toast.error("Billing is not configured on this deployment yet. Set STRIPE_SECRET_KEY.");
      return;
    }
    setLoadingPlan(planId);
    try {
      const result = await createCheckoutSession(planId);
      if (result.error) {
        toast.error(result.error);
      } else if (result.url) {
        window.location.assign(result.url);
      }
    } catch {
      toast.error("Could not start checkout. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const result = await openBillingPortal();
      if (result.error) {
        toast.error(result.error);
      } else if (result.url) {
        window.location.assign(result.url);
      }
    } catch {
      toast.error("Could not open the billing portal.");
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlanId;
          const isUpgrade = plan.id !== "free" && !isCurrent && isFree;
          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border p-6 shadow-soft ${
                plan.popular
                  ? "border-ember bg-ember/5"
                  : isCurrent
                    ? "border-emerald-500/40 bg-card"
                    : "border-border bg-card"
              }`}
            >
              {plan.popular && !isCurrent && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-ember px-3 py-1 text-xs font-semibold text-ember-foreground">
                  Most popular
                </span>
              )}
              {isCurrent && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
                  Current plan
                </span>
              )}
              <h3 className="text-display text-lg font-semibold">{plan.name}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-display text-4xl font-bold">
                  ${plan.priceMonthly}
                </span>
                <span className="text-sm text-muted-foreground">/mo</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      <Check className="h-2.5 w-2.5" />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <Button
                  variant="outline"
                  disabled
                  className="mt-6 border-border text-muted-foreground"
                >
                  {plan.id === "free" ? "Current plan" : "Active"}
                </Button>
              ) : plan.id === "free" ? (
                <Button
                  variant="outline"
                  disabled={portalLoading || !stripeEnabled || isFree}
                  onClick={handlePortal}
                  className="mt-6 border-border text-foreground hover:border-ember hover:text-ember"
                >
                  Downgrade via portal
                </Button>
              ) : (
                <Button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={loadingPlan === plan.id}
                  className={`mt-6 ${
                    plan.popular || isUpgrade
                      ? "bg-ember text-ember-foreground shadow-ember hover:bg-ember/90"
                      : "border border-border bg-surface text-foreground hover:border-ember hover:text-ember"
                  }`}
                >
                  {loadingPlan === plan.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Redirecting…
                    </>
                  ) : (
                    `Upgrade to ${plan.name}`
                  )}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-border bg-card px-5 py-4 shadow-soft sm:flex-row sm:items-center">
        <div className="text-sm text-muted-foreground">
          Need to change your payment method or cancel? Use the Stripe customer portal.
        </div>
        <Button
          variant="outline"
          onClick={handlePortal}
          disabled={portalLoading || !stripeEnabled || isFree}
          className="border-border text-foreground hover:bg-accent shrink-0"
        >
          {portalLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CreditCard className="mr-2 h-4 w-4" />
          )}
          Manage billing
        </Button>
      </div>
    </div>
  );
}