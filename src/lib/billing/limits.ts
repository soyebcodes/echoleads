import { db } from "@/lib/db";
import { campaigns, leads, subscriptions, usageMonthly } from "@/lib/db/schema";
import { and, eq, gte, sql } from "drizzle-orm";
import { getPlan, PLANS, type PlanDefinition, type PlanId } from "@/lib/billing/plans";

export function currentMonthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

function monthStart(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export async function getUserPlanId(userId: string): Promise<PlanId> {
  const [row] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId));

  if (!row) return "free";

  const billable = row.status === "active" || row.status === "trialing" || row.status === "past_due";
  if (!billable) return "free";
  if (row.plan in PLANS) return row.plan as PlanId;
  return "free";
}

export async function getSubscription(userId: string) {
  const [row] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId));
  return row ?? null;
}

export async function getCampaignCount(userId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(campaigns)
    .where(eq(campaigns.userId, userId));
  return Number(row?.count ?? 0);
}

export async function getMonthlyLeadCount(userId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(leads)
    .innerJoin(campaigns, eq(leads.campaignId, campaigns.id))
    .where(and(eq(campaigns.userId, userId), gte(leads.createdAt, monthStart())));
  return Number(row?.count ?? 0);
}

export async function getMonthlyAiReplyCount(userId: string): Promise<number> {
  const [row] = await db
    .select()
    .from(usageMonthly)
    .where(and(eq(usageMonthly.userId, userId), eq(usageMonthly.month, currentMonthKey())));
  return Number(row?.aiReplies ?? 0);
}

export type UsageMetric = { used: number; limit: number };

export type UsageOverview = {
  planId: PlanId;
  plan: PlanDefinition;
  campaigns: UsageMetric;
  leads: UsageMetric;
  aiReplies: UsageMetric;
};

export async function getUsageOverview(userId: string): Promise<UsageOverview> {
  const planId = await getUserPlanId(userId);
  const plan = getPlan(planId);
  const [campaignsUsed, leadsUsed, aiRepliesUsed] = await Promise.all([
    getCampaignCount(userId),
    getMonthlyLeadCount(userId),
    getMonthlyAiReplyCount(userId),
  ]);

  return {
    planId,
    plan,
    campaigns: { used: campaignsUsed, limit: plan.campaigns },
    leads: { used: leadsUsed, limit: plan.leadsPerMonth },
    aiReplies: { used: aiRepliesUsed, limit: plan.aiRepliesPerMonth },
  };
}

export async function getLeadsQuotaRemaining(userId: string): Promise<number> {
  const overview = await getUsageOverview(userId);
  return Math.max(0, overview.plan.leadsPerMonth - overview.leads.used);
}

export async function canCreateCampaign(userId: string): Promise<boolean> {
  const overview = await getUsageOverview(userId);
  return overview.campaigns.used < overview.campaigns.limit;
}

export async function canGenerateAiReply(userId: string): Promise<boolean> {
  const overview = await getUsageOverview(userId);
  return overview.aiReplies.used < overview.aiReplies.limit;
}

export async function incrementAiReplyUsage(userId: string): Promise<void> {
  await db
    .insert(usageMonthly)
    .values({ userId, month: currentMonthKey(), aiReplies: 1 })
    .onConflictDoUpdate({
      target: [usageMonthly.userId, usageMonthly.month],
      set: { aiReplies: sql`${usageMonthly.aiReplies} + 1` },
    });
}