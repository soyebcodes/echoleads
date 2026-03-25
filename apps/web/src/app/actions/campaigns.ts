"use server";

import { db } from "db";
import { campaigns, keywords, voiceSamples } from "db/schema";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createCampaign(data: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  try {
    // 1. Create campaign
    const [newCampaign] = await db.insert(campaigns).values({
      userId: user.id,
      name: data.name,
      description: data.description,
      leadType: data.leadType,
      timeFilterDays: parseInt(data.timeFilterDays) || 7,
      minLikes: parseInt(data.minLikes) || 0,
      minComments: parseInt(data.minComments) || 0,
      targetDescription: data.targetDescription,
      excludeDescription: data.excludeDescription,
    }).returning();

    // 2. Insert keywords
    if (data.keywords && data.keywords.length > 0) {
      await db.insert(keywords).values(
        data.keywords.map((kw: any) => ({
          campaignId: newCampaign.id,
          phrase: kw.phrase,
          isNegative: kw.isNegative,
        }))
      );
    }

    // 3. Insert voice samples
    if (data.voiceSamples && data.voiceSamples.length > 0) {
      await db.insert(voiceSamples).values(
        data.voiceSamples.map((vs: any) => ({
          campaignId: newCampaign.id,
          samplePostContext: vs.samplePostContext,
          userReply: vs.userReply,
        }))
      );
    }

    revalidatePath("/dashboard/campaigns");
    return { success: true, id: newCampaign.id };
  } catch (error: any) {
    console.error("Error creating campaign:", error);
    return { error: error.message };
  }
}

export async function getCampaigns() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { eq } = await import("drizzle-orm");

  if (!user) return [];

  return await db.select().from(campaigns).where(eq(campaigns.userId, user.id));
}
