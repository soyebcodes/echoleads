"use server";

import { db } from "db";
import { leads, campaigns, voiceSamples } from "db/schema";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getLeads() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  return await db
    .select({
      id: leads.id,
      title: leads.title,
      content: leads.content,
      url: leads.url,
      author: leads.author,
      aiRelevanceScore: leads.aiRelevanceScore,
      status: leads.status,
      createdAt: leads.createdAt,
      campaignName: campaigns.name,
    })
    .from(leads)
    .innerJoin(campaigns, eq(leads.campaignId, campaigns.id))
    .where(eq(campaigns.userId, user.id))
    .orderBy(leads.createdAt);
}

export async function generateAIResponse(leadId: number) {
  const [lead] = await db.select().from(leads).where(eq(leads.id, leadId));
  const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, lead.campaignId!));
  const samples = await db.select().from(voiceSamples).where(eq(voiceSamples.campaignId, campaign.id));

  const prompt = `
    Draft a cold Reddit DM response for this lead.
    
    CAMPAIGN: ${campaign.name}
    CONTEXT: ${campaign.description}
    VOICE SAMPLES (How I typically write):
    ${samples.map(s => `Post: ${s.samplePostContext}\nMy Reply: ${s.userReply}`).join("\n\n")}
    
    LEAD POST TITLE: ${lead.title}
    LEAD POST CONTENT: ${lead.content}
    
    Write a 1-2 paragraph DM that sounds human, helpful, and mirrors my voice samples. 
    DO NOT use generic sales speak. No placeholders like [Name].
    Return ONLY the message content.
  `;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });

    const data: any = await response.json();
    return data.choices?.[0].message.content || "Failed to generate AI response.";
  } catch (err) {
    console.error("Groq error:", err);
    return "Error generating response.";
  }
}

export async function markAsContacted(leadId: number) {
  await db.update(leads).set({ status: "contacted" }).where(eq(leads.id, leadId));
  revalidatePath("/dashboard/leads");
}
