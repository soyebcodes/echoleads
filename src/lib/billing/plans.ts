export type PlanId = "free" | "pro" | "business";
export type LeadPlatform = "reddit" | "hacker_news" | "x";

export type PlanDefinition = {
  id: PlanId;
  name: string;
  priceMonthly: number;
  currency: string;
  description: string;
  campaigns: number;
  leadsPerMonth: number;
  aiRepliesPerMonth: number;
  platforms: LeadPlatform[];
  features: string[];
  popular?: boolean;
};

export const PLATFORM_LABELS: Record<LeadPlatform, string> = {
  reddit: "Reddit",
  hacker_news: "Hacker News",
  x: "X (Twitter)",
};

export const ALL_PLATFORMS: LeadPlatform[] = ["reddit", "hacker_news", "x"];

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    currency: "usd",
    description: "Try EchoLeads on Reddit and Hacker News, free forever.",
    campaigns: 1,
    leadsPerMonth: 50,
    aiRepliesPerMonth: 20,
    platforms: ["reddit", "hacker_news"],
    features: [
      "1 campaign",
      "50 leads per month",
      "Reddit + Hacker News scanning",
      "20 AI reply drafts per month",
      "AI intent scoring",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceMonthly: 19,
    currency: "usd",
    description: "For founders who need more reach and every AI feature.",
    campaigns: 5,
    leadsPerMonth: 1000,
    aiRepliesPerMonth: 500,
    platforms: ["reddit", "hacker_news", "x"],
    features: [
      "5 campaigns",
      "1,000 leads per month",
      "Reddit + Hacker News scanning",
      "X (Twitter) — coming soon",
      "500 AI reply drafts per month",
      "CSV export",
      "Priority AI scoring",
    ],
    popular: true,
  },
  business: {
    id: "business",
    name: "Business",
    priceMonthly: 49,
    currency: "usd",
    description: "For agencies and sales teams running multi-platform pipeline.",
    campaigns: 25,
    leadsPerMonth: 5000,
    aiRepliesPerMonth: 2000,
    platforms: ["reddit", "hacker_news", "x"],
    features: [
      "25 campaigns",
      "5,000 leads per month",
      "Reddit + Hacker News scanning",
      "X (Twitter) — coming soon",
      "2,000 AI reply drafts per month",
      "CSV export",
      "Priority support",
    ],
  },
};

export const PAID_PLANS: PlanId[] = ["pro", "business"];

export function getPlan(planId: string | null | undefined): PlanDefinition {
  if (planId && planId in PLANS) return PLANS[planId as PlanId];
  return PLANS.free;
}