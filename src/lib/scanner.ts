import { db } from "@/lib/db";
import { campaigns, keywords, leads } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { chatJson, isAiConfigured } from "@/lib/ai/provider";
import { fetchPlatformPosts } from "@/lib/leads-sources";
import type { SourcePost } from "@/lib/leads-sources";
import { getPlan, PLATFORM_LABELS, type LeadPlatform } from "@/lib/billing/plans";
import { getLeadsQuotaRemaining, getUserPlanId } from "@/lib/billing/limits";

const SCORE_THRESHOLD = 70;
const MAX_CANDIDATES_PER_SCAN = 24;
const SCORE_CHUNK_SIZE = 8;

export type ScanResult = {
  status: "success" | "failed";
  error: string | null;
  inserted: number;
};

type ScoreResult = { score: number; reason: string };

function normalize(value: string | null | undefined): string {
  return (value ?? "").toLowerCase();
}

function matchesAnyKeyword(text: string, phrases: string[]): boolean {
  const lower = text.toLowerCase();
  return phrases.some((phrase) => lower.includes(phrase.toLowerCase()));
}

function heuristicScore(post: SourcePost, positiveKeywords: string[]): ScoreResult {
  const titleHit = matchesAnyKeyword(post.title, positiveKeywords);
  const contentHit = matchesAnyKeyword(post.content ?? "", positiveKeywords);
  if (titleHit) return { score: 78, reason: "Keyword match in post title (AI scoring unavailable)." };
  if (contentHit) return { score: 72, reason: "Keyword match in post content (AI scoring unavailable)." };
  return { score: 55, reason: "No direct keyword match (AI scoring unavailable)." };
}

function buildScoringPrompt(
  post: SourcePost,
  context: {
    campaignName: string;
    description: string | null;
    targetDescription: string | null;
    excludeDescription: string | null;
    positiveKeywords: string[];
    negativeKeywords: string[];
  },
): string {
  const content = (post.content ?? "").slice(0, 1200);
  return [
    `Campaign: ${context.campaignName}`,
    `What we sell: ${context.description ?? "(no description)"}`,
    `Ideal customer: ${context.targetDescription ?? "(anyone with the problem we solve)"}`,
    `Exclude leads that are: ${context.excludeDescription ?? "(nothing specific)"}`,
    `Positive keywords: ${context.positiveKeywords.join(", ") || "(none)"}`,
    `Negative keywords: ${context.negativeKeywords.join(", ") || "(none)"}`,
    "",
    `Lead post from ${PLATFORM_LABELS[post.platform]}:`,
    `Author: ${post.author}`,
    `Title: ${post.title}`,
    `Content: ${content || "(no content)"}`,
    "",
    "Score how strongly this person is a potential buyer for what the campaign sells.",
    'Return JSON: {"score": <integer 0-100>, "reason": "<one short sentence explaining the score>"}',
    "score >= 70 only if the author shows real buying intent, is actively asking for a solution like ours, or describes the exact problem we solve.",
    "score <= 30 if the post is about a competitor's product, a job offer, hiring, or generic discussion without intent.",
  ].join("\n");
}

async function scorePost(
  post: SourcePost,
  context: Parameters<typeof buildScoringPrompt>[1],
): Promise<ScoreResult> {
  if (!isAiConfigured()) return heuristicScore(post, context.positiveKeywords);
  try {
    const result = await chatJson<ScoreResult>(
      [
        {
          role: "system",
          content:
            "You are a B2B lead-scoring engine. You judge social posts for buying intent with high precision. You always respond with valid JSON only.",
        },
        { role: "user", content: buildScoringPrompt(post, context) },
      ],
      { temperature: 0.2, maxTokens: 700, timeoutMs: 45_000 },
    );
    const score = Math.max(0, Math.min(100, Math.round(Number(result.score) || 0)));
    return { score, reason: String(result.reason ?? "").slice(0, 300) };
  } catch (error) {
    console.error("AI scoring failed, falling back to heuristic:", error);
    return heuristicScore(post, context.positiveKeywords);
  }
}

async function setCampaignStatus(
  campaignId: string,
  status: string,
  error: string | null,
): Promise<void> {
  await db
    .update(campaigns)
    .set({
      lastRunAt: new Date(),
      lastRunStatus: status,
      lastRunError: error,
    })
    .where(eq(campaigns.id, campaignId));
}

export async function runCampaignScan(campaignId: string): Promise<ScanResult> {
  const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, campaignId));
  if (!campaign) {
    return { status: "failed", error: "Campaign not found", inserted: 0 };
  }

  const keywordRows = await db
    .select()
    .from(keywords)
    .where(eq(keywords.campaignId, campaignId));

  const positiveKeywords = keywordRows.filter((k) => !k.isNegative).map((k) => k.phrase);
  const negativeKeywords = keywordRows.filter((k) => k.isNegative).map((k) => k.phrase);

  if (positiveKeywords.length === 0) {
    await setCampaignStatus(campaignId, "failed", "Campaign has no positive keywords.");
    return { status: "failed", error: "Campaign has no positive keywords.", inserted: 0 };
  }

  const planId = await getUserPlanId(campaign.userId);
  const plan = getPlan(planId);
  const requestedPlatforms = (campaign.platforms ?? ["reddit"]) as LeadPlatform[];
  const allowedPlatforms = requestedPlatforms.filter(
    (p): p is LeadPlatform => (plan.platforms as string[]).includes(p),
  );

  if (allowedPlatforms.length === 0) {
    await setCampaignStatus(
      campaignId,
      "failed",
      `Your ${plan.name} plan does not include any of the selected platforms. Upgrade to unlock more platforms.`,
    );
    return {
      status: "failed",
      error: "Plan does not include selected platforms",
      inserted: 0,
    };
  }

  const quotaRemaining = await getLeadsQuotaRemaining(campaign.userId);
  if (quotaRemaining <= 0) {
    const message = `Monthly lead quota reached (${plan.leadsPerMonth} leads on ${plan.name}). Upgrade to continue scanning.`;
    await setCampaignStatus(campaignId, "failed", message);
    return { status: "failed", error: message, inserted: 0 };
  }

  const fetchParams = {
    keywords: positiveKeywords,
    timeFilterDays: campaign.timeFilterDays ?? 7,
    minLikes: campaign.minLikes ?? 0,
    minComments: campaign.minComments ?? 0,
    maxResults: 25,
  };

  const platformResults = await Promise.allSettled(
    allowedPlatforms.map(async (platform) => {
      const posts = await fetchPlatformPosts(platform, fetchParams);
      return { platform, posts };
    }),
  );

  const collected: SourcePost[] = [];
  const platformErrors: string[] = [];
  const skippedPlatforms: string[] = [];

  for (let i = 0; i < platformResults.length; i += 1) {
    const result = platformResults[i];
    const platform = allowedPlatforms[i];
    if (result.status === "fulfilled") {
      collected.push(...result.value.posts);
    } else {
      const reason = result.reason instanceof Error ? result.reason.message : String(result.reason);
      if (result.reason instanceof Error && result.reason.name === "PlatformNotConfiguredError") {
        skippedPlatforms.push(`${PLATFORM_LABELS[platform]}: ${reason}`);
      } else {
        platformErrors.push(`${PLATFORM_LABELS[platform]}: ${reason}`);
      }
    }
  }

  const seen = new Set<string>();
  const filteredPosts = collected.filter((post) => {
    const key = `${post.platform}:${post.externalId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    const haystack = normalize(`${post.title} ${post.content ?? ""}`);
    if (matchesAnyKeyword(haystack, negativeKeywords)) return false;
    if (!matchesAnyKeyword(haystack, positiveKeywords)) return false;
    return true;
  });
  const candidates = filteredPosts.slice(0, MAX_CANDIDATES_PER_SCAN);

  const scoringContext = {
    campaignName: campaign.name,
    description: campaign.description,
    targetDescription: campaign.targetDescription,
    excludeDescription: campaign.excludeDescription,
    positiveKeywords,
    negativeKeywords,
  };

  const scored: Array<{ post: SourcePost; score: ScoreResult }> = [];
  for (let i = 0; i < candidates.length; i += SCORE_CHUNK_SIZE) {
    const chunk = candidates.slice(i, i + SCORE_CHUNK_SIZE);
    const results = await Promise.all(
      chunk.map(async (post) => ({ post, score: await scorePost(post, scoringContext) })),
    );
    scored.push(...results);
  }

  const qualifiedAll = scored
    .filter(({ score }) => score.score >= SCORE_THRESHOLD)
    .sort((a, b) => b.score.score - a.score.score);
  const qualified = qualifiedAll.slice(0, quotaRemaining);

  let inserted = 0;
  if (qualified.length > 0) {
    const insertedRows = await db
      .insert(leads)
      .values(
        qualified.map(({ post, score }) => ({
          campaignId,
          platform: post.platform,
          externalId: post.externalId,
          title: post.title,
          content: post.content,
          url: post.url,
          author: post.author,
          aiRelevanceScore: score.score,
          aiScoreReason: score.reason,
          status: "new",
        })),
      )
      .onConflictDoNothing({
        target: [leads.campaignId, leads.platform, leads.externalId],
      })
      .returning({ id: leads.id });
    inserted = insertedRows.length;
  }

  const scoringLabel = isAiConfigured() ? "AI scoring" : "keyword fallback";
  const notes: string[] = [
    `Scan details — fetched ${collected.length} post(s), ${filteredPosts.length} matched your keyword filters, ${qualifiedAll.length} scored ${SCORE_THRESHOLD}+ (${scoringLabel}), ${inserted} new lead(s) saved.`,
  ];
  if (skippedPlatforms.length > 0) notes.push(`Skipped — ${skippedPlatforms.join("; ")}`);
  if (platformErrors.length > 0) notes.push(`Platform errors — ${platformErrors.join("; ")}`);
  if (qualifiedAll.length > 0 && qualified.length >= quotaRemaining) {
    notes.push(
      `Lead quota reached — ${inserted} new lead(s) saved, remaining candidates discarded. Upgrade to capture more.`,
    );
  }

  const fetchedAny = platformResults.some((r) => r.status === "fulfilled");

  if (!fetchedAny) {
    const error = platformErrors[0] || "All platforms failed to return results.";
    await setCampaignStatus(campaignId, "failed", error);
    return { status: "failed", error, inserted };
  }

  await setCampaignStatus(campaignId, "success", notes.length > 0 ? notes.join(" | ") : null);
  return {
    status: "success",
    error: notes.length > 0 ? notes.join(" | ") : null,
    inserted,
  };
}