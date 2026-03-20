import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";
import { XMLParser } from "fast-xml-parser";

type Bindings = {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  GROQ_API_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Health check
app.get("/", (c) => c.text("EchoLeads Worker is running!"));

// Main logic triggered by Cron
export default {
  async scheduled(event: any, env: Bindings, ctx: any) {
    ctx.waitUntil(processLeads(env));
  },
  fetch: app.fetch,
};

async function processLeads(env: Bindings) {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  
  // 1. Get active campaigns
  const { data: campaigns, error: campaignError } = await supabase
    .from("campaigns")
    .select("*, keywords(*)");

  if (campaignError || !campaigns) {
    console.error("Error fetching campaigns:", campaignError);
    return;
  }

  for (const campaign of campaigns) {
    // 2. Fetch Reddit RSS (simplified for now - using a generic dev subreddit or keywords)
    // In a real app, you'd iterate subreddits or use a search RSS
    const rssUrl = `https://www.reddit.com/r/saas/new.rss`;
    const response = await fetch(rssUrl, {
      headers: { "User-Agent": "EchoLeads/1.0.0" }
    });
    
    if (!response.ok) continue;
    
    const xml = await response.text();
    const parser = new XMLParser();
    const feed = parser.parse(xml);
    const items = feed.feed?.entry || [];

    for (const item of items) {
      const title = item.title || "";
      const content = item.content || "";
      const author = item.author?.name || "";
      const id = item.id || "";
      const url = item.link?.["@_href"] || "";

      // 3. Pre-filter by negative keywords
      const negativeKeywords = campaign.keywords
        .filter((k: any) => k.isNegative)
        .map((k: any) => k.phrase.toLowerCase());

      const hasNegative = negativeKeywords.some((kw: string) => 
        title.toLowerCase().includes(kw) || content.toLowerCase().includes(kw)
      );

      if (hasNegative) continue;

      // 4. AI Relevance Scoring (Groq)
      const score = await getAIRelevanceScore(env.GROQ_API_KEY, campaign, title, content);
      
      if (score >= 70) {
        // 5. Save to leads
        await supabase.from("leads").upsert({
          campaign_id: campaign.id,
          reddit_post_id: id,
          title,
          content,
          url,
          author,
          ai_relevance_score: score,
          status: "new",
        }, { onConflict: "reddit_post_id" });
      }
    }
  }
}

async function getAIRelevanceScore(apiKey: string, campaign: any, postTitle: string, postContent: string) {
  const prompt = `
    You are an AI lead generator. Analyze this Reddit post for relevance to a campaign.
    
    CAMPAIGN: ${campaign.name}
    DESCRIPTION: ${campaign.description}
    TARGET CUSTOMER: ${campaign.targetDescription}
    
    POST TITLE: ${postTitle}
    POST CONTENT: ${postContent}
    
    Provide a score from 0 to 100 on how likely this person is a high-intent lead for the campaign.
    Return ONLY the number.
  `;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
      }),
    });

    const data: any = await response.json();
    const text = data.choices[0].message.content.trim();
    return parseInt(text.replace(/[^0-9]/g, "")) || 0;
  } catch (err) {
    console.error("Groq API error:", err);
    return 0;
  }
}
