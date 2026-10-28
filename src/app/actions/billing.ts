"use server";

import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { appBaseUrl, getStripe, isStripeEnabled } from "@/lib/stripe";
import { getSubscription, getUsageOverview } from "@/lib/billing/limits";
import { PLANS, type PlanId } from "@/lib/billing/plans";

export async function getBillingOverview() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [overview, subscription] = await Promise.all([
    getUsageOverview(user.id),
    getSubscription(user.id),
  ]);

  return {
    email: user.email ?? "",
    planId: overview.planId,
    plan: overview.plan,
    usage: {
      campaigns: overview.campaigns,
      leads: overview.leads,
      aiReplies: overview.aiReplies,
    },
    stripeEnabled: isStripeEnabled(),
    currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
    subscriptionStatus: subscription?.status ?? "free",
  };
}

export async function createCheckoutSession(planId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be signed in to upgrade." };

  const stripe = getStripe();
  if (!stripe) {
    return {
      error:
        "Billing is not configured on this deployment. Set STRIPE_SECRET_KEY to enable subscriptions.",
    };
  }

  if (planId !== "pro" && planId !== "business") {
    return { error: "Unknown plan." };
  }

  const plan = PLANS[planId as PlanId];
  const existing = await getSubscription(user.id);
  let customerId = existing?.stripeCustomerId ?? null;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { userId: user.id },
    });
    customerId = customer.id;

    await db
      .insert(subscriptions)
      .values({
        userId: user.id,
        stripeCustomerId: customerId,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: subscriptions.userId,
        set: { stripeCustomerId: customerId, updatedAt: new Date() },
      });
  }

  const envPriceId =
    planId === "pro" ? process.env.STRIPE_PRICE_PRO : process.env.STRIPE_PRICE_BUSINESS;

  const lineItem =
    envPriceId
      ? { price: envPriceId, quantity: 1 }
      : {
          quantity: 1,
          price_data: {
            currency: plan.currency,
            product_data: { name: `EchoLeads ${plan.name}` },
            unit_amount: plan.priceMonthly * 100,
            recurring: { interval: "month" as const },
          },
        };

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [lineItem],
      allow_promotion_codes: true,
      success_url: `${appBaseUrl()}/dashboard/billing?checkout=success`,
      cancel_url: `${appBaseUrl()}/dashboard/billing?checkout=canceled`,
      metadata: { userId: user.id, plan: planId },
      subscription_data: { metadata: { userId: user.id, plan: planId } },
    });

    return { url: session.url };
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return {
      error: error instanceof Error
        ? error.message
        : "Could not start checkout. Please try again.",
    };
  }
}

export async function openBillingPortal() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be signed in." };

  const stripe = getStripe();
  if (!stripe) {
    return { error: "Billing is not configured on this deployment." };
  }

  const existing = await getSubscription(user.id);
  if (!existing?.stripeCustomerId) {
    return { error: "You don't have an active billing profile yet. Upgrade first." };
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: existing.stripeCustomerId,
      return_url: `${appBaseUrl()}/dashboard/billing`,
    });
    return { url: session.url };
  } catch (error) {
    console.error("Stripe portal error:", error);
    return {
      error:
        "Could not open the billing portal. Make sure the Stripe customer portal is configured in your Stripe dashboard (Settings → Billing → Customer portal).",
    };
  }
}