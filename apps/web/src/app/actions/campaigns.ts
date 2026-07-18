"use server";

import { db } from "db";
import { campaigns, keywords, voiceSamples } from "db/schema";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";

const STALE_RUNNING_THRESHOLD_MS = 5 * 60 * 1000;

async function triggerWorkerRun(campaignId: string) {
  const workerUrl =
    process.env.WORKER_TRIGGER_URL ||
    process.env.CLOUDFLARE_WORKER_URL ||
    process.env.WORKER_URL;

  if (!workerUrl) {
    console.warn("No worker trigger URL configured; skipping immediate run.");
    return;
  }

  try {
    const response = await fetch(workerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.WORKER_API_KEY
          ? { "x-worker-token": process.env.WORKER_API_KEY }
          : {}),
      },
      body: JSON.stringify({ campaignId }),
    });

    if (!response.ok) {
      console.error(
        `Failed to trigger worker run for campaign ${campaignId}:`,
        response.status,
      );
    }
  } catch (error) {
    console.error(
      `Error triggering worker run for campaign ${campaignId}:`,
      error,
    );
  }
}

export async function createCampaign(data: any) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  try {
    // 1. Create campaign
    const [newCampaign] = await db
      .insert(campaigns)
      .values({
        userId: user.id,
        name: data.name,
        description: data.description,
        leadType: data.leadType,
        timeFilterDays: parseInt(data.timeFilterDays) || 7,
        minLikes: parseInt(data.minLikes) || 0,
        minComments: parseInt(data.minComments) || 0,
        targetDescription: data.targetDescription,
        excludeDescription: data.excludeDescription,
      })
      .returning();

    // 2. Insert keywords
    if (data.keywords && data.keywords.length > 0) {
      await db.insert(keywords).values(
        data.keywords.map((kw: any) => ({
          campaignId: newCampaign.id,
          phrase: kw.phrase,
          isNegative: kw.isNegative,
        })),
      );
    }

    // 3. Insert voice samples
    if (data.voiceSamples && data.voiceSamples.length > 0) {
      await db.insert(voiceSamples).values(
        data.voiceSamples.map((vs: any) => ({
          campaignId: newCampaign.id,
          samplePostContext: vs.samplePostContext,
          userReply: vs.userReply,
        })),
      );
    }

    void triggerWorkerRun(newCampaign.id);

    revalidatePath("/dashboard/campaigns");
    return { success: true, id: newCampaign.id };
  } catch (error: any) {
    console.error("Error creating campaign:", error);
    return { error: error.message };
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

      const leadCountRows = await db.execute<{ count: number }>(
        `select count(*)::int as count from leads where campaign_id = '${campaign.id}'`,
      );
      const leadCount = leadCountRows[0]?.count ?? 0;
      return {
        ...campaign,
        lastRunStatus: isStaleRunning ? "failed" : campaign.lastRunStatus,
        lastRunError: isStaleRunning
          ? "Scan timed out or did not finish."
          : campaign.lastRunError,
        leadCount: Number(leadCount),
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

  try {
    await db
      .update(campaigns)
      .set({
        lastRunAt: new Date(),
        lastRunStatus: "running",
        lastRunError: null,
      })
      .where(and(eq(campaigns.id, id), eq(campaigns.userId, user.id)));
  } catch (error) {
    console.warn(
      "Could not update last run status columns; migration may not be applied yet.",
      error,
    );
  }

  await triggerWorkerRun(id);
  revalidatePath("/dashboard/campaigns");
  return { success: true };
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
