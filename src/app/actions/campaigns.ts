"use server";

import { db } from "@/lib/db";
import { campaigns, keywords, voiceSamples, leads } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { eq, and, inArray, sql } from "drizzle-orm";
import { runCampaignScan } from "@/lib/scanner";
import { getPlan, type LeadPlatform } from "@/lib/billing/plans";
import { canCreateCampaign, getUserPlanId } from "@/lib/billing/limits";
import { getExternalScannerUrl, scannerApiKey } from "@/lib/scanner-config";

const STALE_RUNNING_THRESHOLD_MS = 5 * 60 * 1000;

type CampaignInput = {
  name?: string;
  description?: string;
  leadType?: string;
  platforms?: string[];
  timeFilterDays?: string | number;
  minLikes?: string | number;
  minComments?: string | number;
  targetDescription?: string;
  excludeDescription?: string;
  keywords?: Array<{ phrase: string; isNegative: boolean }>;
  voiceSamples?: Array<{ samplePostContext: string; userReply: string }>;
};

function sanitizePlatforms(input: string[] | undefined, allowed: string[]): LeadPlatform[] {
  const requested = (input ?? []).filter((p): p is LeadPlatform =>
    ["reddit", "hacker_news", "x"].includes(p),
  );
  const filtered = requested.filter((p) => (allowed as string[]).includes(p));
  if (filtered.length > 0) return filtered;
  return ["reddit"] as LeadPlatform[];
}

export async function createCampaign(data: CampaignInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const allowedToCreate = await canCreateCampaign(user.id);
  if (!allowedToCreate) {
    const plan = getPlan(await getUserPlanId(user.id));
    return {
      error: `You've reached the ${plan.campaigns} campaign limit on the ${plan.name} plan. Upgrade to create more campaigns.`,
    };
  }

  try {
    const plan = getPlan(await getUserPlanId(user.id));
    const platforms = sanitizePlatforms(data.platforms, plan.platforms);

    const [newCampaign] = await db
      .insert(campaigns)
      .values({
        userId: user.id,
        name: data.name ?? "",
        description: data.description ?? null,
        leadType: data.leadType ?? "product",
        platforms,
        timeFilterDays: parseInt(String(data.timeFilterDays ?? "7")) || 7,
        minLikes: parseInt(String(data.minLikes ?? "0")) || 0,
        minComments: parseInt(String(data.minComments ?? "0")) || 0,
        targetDescription: data.targetDescription ?? null,
        excludeDescription: data.excludeDescription ?? null,
      })
      .returning();

    if (data.keywords && data.keywords.length > 0) {
      await db.insert(keywords).values(
        data.keywords.map((kw) => ({
          campaignId: newCampaign.id,
          phrase: kw.phrase,
          isNegative: kw.isNegative,
        })),
      );
    }

    if (data.voiceSamples && data.voiceSamples.length > 0) {
      await db.insert(voiceSamples).values(
        data.voiceSamples.map((vs) => ({
          campaignId: newCampaign.id,
          samplePostContext: vs.samplePostContext,
          userReply: vs.userReply,
        })),
      );
    }

    revalidatePath("/dashboard/campaigns");
    return { success: true, id: newCampaign.id };
  } catch (error) {
    console.error("Error creating campaign:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to create campaign",
    };
  }
}

export async function getCampaigns() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const campaignRows = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.userId, user.id));

  const campaignIds = campaignRows.map((c) => c.id);
  const leadCountRows =
    campaignIds.length > 0
      ? await db
          .select({ campaignId: leads.campaignId, count: sql<number>`count(*)::int` })
          .from(leads)
          .where(inArray(leads.campaignId, campaignIds))
          .groupBy(leads.campaignId)
      : [];

  const leadCountByCampaign = new Map(
    leadCountRows.map((row) => [row.campaignId, Number(row.count)]),
  );

  const campaignsWithCounts = await Promise.all(
    campaignRows.map(async (campaign) => {
      const isStaleRunning =
        campaign.lastRunStatus === "running" &&
        campaign.lastRunAt &&
        Date.now() - new Date(campaign.lastRunAt).getTime() >
          STALE_RUNNING_THRESHOLD_MS;

      if (isStaleRunning) {
        await db
          .update(campaigns)
          .set({
            lastRunStatus: "failed",
            lastRunError: "Scan timed out or did not finish.",
          })
          .where(eq(campaigns.id, campaign.id));
      }

      return {
        ...campaign,
        lastRunStatus: isStaleRunning ? "failed" : campaign.lastRunStatus,
        lastRunError: isStaleRunning
          ? "Scan timed out or did not finish."
          : campaign.lastRunError,
        leadCount: leadCountByCampaign.get(campaign.id) ?? 0,
      };
    }),
  );

  return campaignsWithCounts;
}

export async function getCampaignById(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(and(eq(campaigns.id, id), eq(campaigns.userId, user.id)));

  if (!campaign) return null;

  const campaignKeywords = await db
    .select()
    .from(keywords)
    .where(eq(keywords.campaignId, id));
  const campaignVoiceSamples = await db
    .select()
    .from(voiceSamples)
    .where(eq(voiceSamples.campaignId, id));

  return {
    ...campaign,
    keywords: campaignKeywords,
    voiceSamples: campaignVoiceSamples,
  };
}

export async function runCampaignNow(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const [campaign] = await db
    .select({ id: campaigns.id })
    .from(campaigns)
    .where(and(eq(campaigns.id, id), eq(campaigns.userId, user.id)));

  if (!campaign) {
    return { error: "Campaign not found" };
  }

  await db
    .update(campaigns)
    .set({
      lastRunAt: new Date(),
      lastRunStatus: "running",
      lastRunError: null,
    })
    .where(eq(campaigns.id, id));

  const externalScannerUrl = getExternalScannerUrl();
  if (externalScannerUrl) {
    try {
      const apiKey = scannerApiKey();
      const response = await fetch(`${externalScannerUrl}/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { "x-api-key": apiKey } : {}),
        },
        body: JSON.stringify({ campaign_id: id }),
        signal: AbortSignal.timeout(180_000),
      });

      if (!response.ok) {
        const message = `Scanner service returned ${response.status}. Try again shortly.`;
        await db
          .update(campaigns)
          .set({ lastRunStatus: "failed", lastRunError: message })
          .where(eq(campaigns.id, id));
        revalidatePath("/dashboard/campaigns");
        return { error: message };
      }

      revalidatePath("/dashboard/campaigns");
      revalidatePath(`/dashboard/campaigns/${id}/leads`);
      revalidatePath("/dashboard/leads");
      return { success: true };
    } catch (error) {
      console.error("External scanner failed:", error);
      const message =
        "Could not reach the scanner service. Check that the backend is running and PYTHON_API_URL is correct.";
      await db
        .update(campaigns)
        .set({ lastRunStatus: "failed", lastRunError: message })
        .where(eq(campaigns.id, id));
      revalidatePath("/dashboard/campaigns");
      return { error: message };
    }
  }

  try {
    const result = await runCampaignScan(id);
    revalidatePath("/dashboard/campaigns");
    revalidatePath(`/dashboard/campaigns/${id}/leads`);
    revalidatePath("/dashboard/leads");
    if (result.status === "failed") {
      return { error: result.error ?? "Scan failed" };
    }
    return { success: true, inserted: result.inserted };
  } catch (error) {
    console.error("Scan failed:", error);
    const message = error instanceof Error ? error.message : "Scan encountered an error.";
    await db
      .update(campaigns)
      .set({
        lastRunStatus: "failed",
        lastRunError: message,
      })
      .where(eq(campaigns.id, id));
    revalidatePath("/dashboard/campaigns");
    return { error: message };
  }
}

export async function deleteCampaign(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  await db
    .delete(campaigns)
    .where(and(eq(campaigns.id, id), eq(campaigns.userId, user.id)));
  revalidatePath("/dashboard/campaigns");
  revalidatePath("/dashboard");
}

export async function updateCampaign(id: string, data: CampaignInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  try {
    const plan = getPlan(await getUserPlanId(user.id));
    const platforms = sanitizePlatforms(data.platforms, plan.platforms);

    await db
      .update(campaigns)
      .set({
        name: data.name ?? "",
        description: data.description ?? null,
        leadType: data.leadType ?? "product",
        platforms,
        timeFilterDays: parseInt(String(data.timeFilterDays ?? "7")) || 7,
        minLikes: parseInt(String(data.minLikes ?? "0")) || 0,
        minComments: parseInt(String(data.minComments ?? "0")) || 0,
        targetDescription: data.targetDescription ?? null,
        excludeDescription: data.excludeDescription ?? null,
      })
      .where(and(eq(campaigns.id, id), eq(campaigns.userId, user.id)));

    await db.delete(keywords).where(eq(keywords.campaignId, id));
    if (data.keywords && data.keywords.length > 0) {
      await db.insert(keywords).values(
        data.keywords.map((kw) => ({
          campaignId: id,
          phrase: kw.phrase,
          isNegative: kw.isNegative,
        })),
      );
    }

    await db.delete(voiceSamples).where(eq(voiceSamples.campaignId, id));
    if (data.voiceSamples && data.voiceSamples.length > 0) {
      await db.insert(voiceSamples).values(
        data.voiceSamples.map((vs) => ({
          campaignId: id,
          samplePostContext: vs.samplePostContext,
          userReply: vs.userReply,
        })),
      );
    }

    revalidatePath("/dashboard/campaigns");
    revalidatePath(`/dashboard/campaigns/${id}`);
    return { success: true };
  } catch (error) {
    console.error("Error updating campaign:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to update campaign",
    };
  }
}