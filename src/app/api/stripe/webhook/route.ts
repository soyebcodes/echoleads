import type Stripe from "stripe";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getStripe } from "@/lib/stripe";

function planFromPrice(priceId: string | undefined, fallback: string | undefined): string {
  if (priceId && priceId === process.env.STRIPE_PRICE_PRO) return "pro";
  if (priceId && priceId === process.env.STRIPE_PRICE_BUSINESS) return "business";
  return fallback || "pro";
}

function billableStatus(status: Stripe.Subscription.Status): boolean {
  return status === "active" || status === "trialing" || status === "past_due";
}

async function upsertSubscription(
  userId: string,
  values: {
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    status: string;
    plan: string;
    stripePriceId: string | null;
    currentPeriodEnd: Date | null;
  },
) {
  await db
    .insert(subscriptions)
    .values({
      userId,
      stripeCustomerId: values.stripeCustomerId,
      stripeSubscriptionId: values.stripeSubscriptionId,
      status: values.status,
      plan: values.plan,
      stripePriceId: values.stripePriceId,
      currentPeriodEnd: values.currentPeriodEnd,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: subscriptions.userId,
      set: {
        stripeCustomerId: values.stripeCustomerId,
        stripeSubscriptionId: values.stripeSubscriptionId,
        status: values.status,
        plan: values.plan,
        stripePriceId: values.stripePriceId,
        currentPeriodEnd: values.currentPeriodEnd,
        updatedAt: new Date(),
      },
    });
}

async function findUserId(subscription: Stripe.Subscription): Promise<string | null> {
  if (subscription.metadata?.userId) return subscription.metadata.userId;

  const [bySubId] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, subscription.id));
  if (bySubId) return bySubId.userId;

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id ?? null;
  if (customerId) {
    const [byCustomer] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.stripeCustomerId, customerId));
    if (byCustomer) return byCustomer.userId;
  }

  return null;
}

async function syncSubscription(subscription: Stripe.Subscription) {
  const userId = await findUserId(subscription);
  if (!userId) {
    console.warn("Stripe webhook: no user found for subscription", subscription.id);
    return;
  }

  const item = subscription.items.data[0];
  const priceId = item?.price?.id ?? undefined;
  const periodEndRaw = item?.current_period_end as number | undefined;

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id ?? null;

  const billable = billableStatus(subscription.status);
  const plan = billable
    ? planFromPrice(priceId, subscription.metadata?.plan)
    : "free";

  await upsertSubscription(userId, {
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    status: subscription.status,
    plan,
    stripePriceId: priceId ?? null,
    currentPeriodEnd: periodEndRaw ? new Date(periodEndRaw * 1000) : null,
  });
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !secret) {
    return Response.json({ error: "Stripe webhook not configured" }, { status: 503 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return Response.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, secret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const subscriptionId =
          typeof session.subscription === "string" ? session.subscription : null;
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          if (!subscription.metadata?.userId && session.metadata?.userId) {
            subscription.metadata = {
              ...subscription.metadata,
              userId: session.metadata.userId,
              plan: session.metadata.plan ?? subscription.metadata?.plan,
            };
          }
          await syncSubscription(subscription);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await syncSubscription(subscription);
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error(`Stripe webhook handler error for ${event.type}:`, error);
    return Response.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return Response.json({ received: true });
}