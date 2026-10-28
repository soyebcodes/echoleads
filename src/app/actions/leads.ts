"use server";

import { db } from "@/lib/db";
import { leads, campaigns, voiceSamples } from "@/lib/db/schema";
import { desc, eq, and, sql } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { chat, isAiConfigured } from "@/lib/ai/provider";
import {
  canGenerateAiReply,
  getUserPlanId,
  incrementAiReplyUsage,
} from "@/lib/billing/limits";
import { getPlan, PLATFORM_LABELS, type LeadPlatform } from "@/lib/billing/plans";

const LEADS_PAGE_SIZE = 10;

const leadColumns = {
  id: leads.id,
  platform: leads.platform,
  externalId: leads.externalId,
  title: leads.title,
  content: leads.content,
  url: leads.url,
  author: leads.author,
  aiRelevanceScore: leads.aiRelevanceScore,
  aiScoreReason: leads.aiScoreReason,
  status: leads.status,
  createdAt: leads.createdAt,
  campaignName: campaigns.name,
};

export async function getLeads() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  return await db
    .select(leadColumns)
    .from(leads)
    .innerJoin(campaigns, eq(leads.campaignId, campaigns.id))
    .where(eq(campaigns.userId, user.id))
    .orderBy(desc(leads.createdAt));
}

export async function getPaginatedLeads(page = 1, pageSize = LEADS_PAGE_SIZE) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { leads: [], total: 0, page: 1, pageSize, totalPages: 1 };
  }

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(leads)
    .innerJoin(campaigns, eq(leads.campaignId, campaigns.id))
    .where(eq(campaigns.userId, user.id));

  const total = Number(countRow?.count ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const offset = (currentPage - 1) * pageSize;

  const rows = await db
    .select(leadColumns)
    .from(leads)
    .innerJoin(campaigns, eq(leads.campaignId, campaigns.id))
    .where(eq(campaigns.userId, user.id))
    .orderBy(desc(leads.createdAt))
    .limit(pageSize)
    .offset(offset);

  return { leads: rows, total, page: currentPage, pageSize, totalPages };
}

export async function getPaginatedLeadsByCampaign(
  campaignId: string,
  page = 1,
  pageSize = LEADS_PAGE_SIZE,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { leads: [], total: 0, page: 1, pageSize, totalPages: 1 };
  }

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(leads)
    .innerJoin(campaigns, eq(leads.campaignId, campaigns.id))
    .where(and(eq(leads.campaignId, campaignId), eq(campaigns.userId, user.id)));

  const total = Number(countRow?.count ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const offset = (currentPage - 1) * pageSize;

  const rows = await db
    .select(leadColumns)
    .from(leads)
    .innerJoin(campaigns, eq(leads.campaignId, campaigns.id))
    .where(and(eq(leads.campaignId, campaignId), eq(campaigns.userId, user.id)))
    .orderBy(desc(leads.createdAt))
    .limit(pageSize)
    .offset(offset);

  return { leads: rows, total, page: currentPage, pageSize, totalPages };
}

async function getOwnedLead(leadId: number, userId: string) {
  const [row] = await db
    .select({ lead: leads, campaign: campaigns })
    .from(leads)
    .innerJoin(campaigns, eq(leads.campaignId, campaigns.id))
    .where(and(eq(leads.id, leadId), eq(campaigns.userId, userId)));
  return row ?? null;
}

export async function getCampaignLeadCount(campaignId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return 0;

  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(leads)
    .innerJoin(campaigns, eq(leads.campaignId, campaigns.id))
    .where(and(eq(leads.campaignId, campaignId), eq(campaigns.userId, user.id)));

  return Number(row?.count ?? 0);
}

function platformReplyInstructions(platform: string): string {
  if (platform === "x") {
    return [
      "This is a reply to a post on X (Twitter). Write ONE short, casual reply (under 280 characters).",
      "Sound like a helpful human, not a salesperson. No hashtags, no emoji spam.",
    ].join(" ");
  }
  if (platform === "hacker_news") {
    return [
      "This is a reply to a post on Hacker News. Write 1-3 sentences in a technical, understated tone.",
      "Hacker News readers dislike sales speak — be direct, concrete, and useful.",
    ].join(" ");
  }
  return [
    "This is a cold Reddit DM response. Write 1-2 paragraphs that sound human, helpful, and mirror the voice samples.",
  ].join(" ");
}

export async function generateAIResponse(leadId: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return "Error: You must be signed in to generate replies.";

  const row = await getOwnedLead(leadId, user.id);
  if (!row) return "Error: Lead not found.";

  const { lead, campaign } = row;
  const planId = await getUserPlanId(user.id);
  const allowed = await canGenerateAiReply(user.id);
  if (!allowed) {
    const plan = getPlan(planId);
    return `You've used all ${plan.aiRepliesPerMonth} AI replies on the ${plan.name} plan this month. Upgrade to keep drafting replies.`;
  }

  const samples = await db
    .select()
    .from(voiceSamples)
    .where(eq(voiceSamples.campaignId, campaign.id));

  const prompt = `
    Draft a response for this lead.

    CAMPAIGN: ${campaign.name}
    CONTEXT: ${campaign.description ?? "(no description)"}
    VOICE SAMPLES (how I typically write):
    ${samples.map((s) => `Post: ${s.samplePostContext}\nMy Reply: ${s.userReply}`).join("\n\n")}

    LEAD POST (${PLATFORM_LABELS[lead.platform as LeadPlatform] ?? lead.platform}):
    Author: ${lead.author}
    Title: ${lead.title}
    Content: ${lead.content ?? "(no content)"}

    ${platformReplyInstructions(lead.platform)}
    DO NOT use generic sales speak. No placeholders like [Name].
    Return ONLY the message content.
  `;

  try {
    if (!isAiConfigured()) {
      return "Error: No AI provider configured. Add OLLAMA_API_KEY or GROQ_API_KEY to the server environment.";
    }

    const text = await chat(
      [
        {
          role: "system",
          content:
            "You are an expert at writing authentic, high-converting outreach replies that match the user's personal voice. You return only the message content.",
        },
        { role: "user", content: prompt },
      ],
      { temperature: 0.7, maxTokens: 600 },
    );

    await incrementAiReplyUsage(user.id);
    return text;
  } catch (error) {
    console.error("AI reply generation failed:", error);
    return "Error generating response. The AI provider may be temporarily unavailable — please try again.";
  }
}

export async function markAsContacted(leadId: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const row = await getOwnedLead(leadId, user.id);
  if (!row) return;

  await db
    .update(leads)
    .set({ status: "contacted" })
    .where(and(eq(leads.id, leadId), eq(leads.campaignId, row.campaign.id)));
  revalidatePath("/dashboard/leads");
}

export async function deleteLead(leadId: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const row = await getOwnedLead(leadId, user.id);
  if (!row) return;

  await db.delete(leads).where(and(eq(leads.id, leadId), eq(leads.campaignId, row.campaign.id)));
  revalidatePath("/dashboard/leads");
}

export async function deleteLeadsByCampaign(campaignId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const [campaign] = await db
    .select({ id: campaigns.id })
    .from(campaigns)
    .where(and(eq(campaigns.id, campaignId), eq(campaigns.userId, user.id)));

  if (!campaign) throw new Error("Campaign not found");

  await db.delete(leads).where(eq(leads.campaignId, campaignId));
  revalidatePath(`/dashboard/campaigns/${campaignId}/leads`);
  revalidatePath("/dashboard/leads");
}

export async function getCampaignScanStatus(campaignId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { leadCount: 0, status: "idle" as string | null };

  const [campaign] = await db
    .select({
      lastRunStatus: campaigns.lastRunStatus,
    })
    .from(campaigns)
    .where(and(eq(campaigns.id, campaignId), eq(campaigns.userId, user.id)));

  if (!campaign) return { leadCount: 0, status: "idle" };

  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(leads)
    .innerJoin(campaigns, eq(leads.campaignId, campaigns.id))
    .where(and(eq(leads.campaignId, campaignId), eq(campaigns.userId, user.id)));

  return {
    leadCount: Number(result?.count) || 0,
    status: campaign?.lastRunStatus || "idle",
  };
}