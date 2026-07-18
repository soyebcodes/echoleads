import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";
import { XMLParser } from "fast-xml-parser";

type Bindings = {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  GROQ_API_KEY: string;
  WORKER_API_KEY?: string;
};

const app = new Hono<{ Bindings: Bindings }>();
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Health check
app.get("/", (c) => c.text("EchoLeads Worker is running!"));

app.post("/run", async (c) => {
  const env = c.env;
  const providedToken =
    c.req.header("x-worker-token") ||
    c.req.header("authorization")?.replace(/^Bearer\s+/i, "");

  if (env.WORKER_API_KEY && providedToken !== env.WORKER_API_KEY) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json().catch(() => ({}));
  const campaignId =
    typeof body?.campaignId === "string" ? body.campaignId : undefined;

  await processLeads(env, { campaignId });
  return c.json({ ok: true, campaignId: campaignId ?? null });
});

// Main logic triggered by Cron
export default {
  async scheduled(event: any, env: Bindings, ctx: any) {
    ctx.waitUntil(processLeads(env));
  },
  fetch: app.fetch,
};

async function processLeads(env: Bindings, options?: { campaignId?: string }) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error(
      "Worker is missing Supabase credentials; cannot process leads.",
    );
    return;
  }

  const supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
  );

  // 1. Get active campaigns
  let campaignsQuery = supabase.from("campaigns").select("*, keywords(*)");

  if (options?.campaignId) {
    campaignsQuery = campaignsQuery.eq("id", options.campaignId);
  }

  const { data: campaigns, error: campaignError } = await campaignsQuery;

  if (campaignError || !campaigns) {
    console.error("Error fetching campaigns:", campaignError);
    return;
  }

  const campaignsToProcess = campaigns.slice(0, 3);

  for (const [index, campaign] of campaignsToProcess.entries()) {
    const markRun = async (status: string, error?: string) => {
      try {
        const { error: updateError } = await supabase
          .from("campaigns")
          .update({
            last_run_at: new Date().toISOString(),
            last_run_status: status,
            last_run_error: error ?? null,
          })
          .eq("id", campaign.id);

        if (updateError) {
          console.warn(
            `[Worker] Could not update campaign status for ${campaign.name}:`,
            updateError.message,
          );
        }
      } catch (err) {
        console.warn(
          `[Worker] Could not update campaign status for ${campaign.name}:`,
          err,
        );
      }
    };

    await markRun("running");

    try {
      const keywords = Array.isArray(campaign.keywords)
        ? campaign.keywords
        : [];
      const positiveKeywords = keywords
        .filter((k: any) => !k.isNegative)
        .map((k: any) => k.phrase.toLowerCase().trim())
        .filter(Boolean);

      const searchQuery = buildSearchQuery(campaign, positiveKeywords);

      // Map timeFilterDays to Reddit's `t` param: day, week, month, year, all
      const timeFilterDays: number = campaign.time_filter_days ?? 7;
      const redditTimePeriod =
        timeFilterDays <= 1
          ? "day"
          : timeFilterDays <= 7
            ? "week"
            : timeFilterDays <= 31
              ? "month"
              : timeFilterDays <= 365
                ? "year"
                : "all";
      const cutoffDate = new Date(
        Date.now() - timeFilterDays * 24 * 60 * 60 * 1000,
      );

      const rssUrl = `https://www.reddit.com/search.rss?q=${encodeURIComponent(searchQuery)}&sort=new&t=${redditTimePeriod}`;

      if (index > 0) {
        await delay(15000);
      }

      const response = await fetchRedditFeed(rssUrl, campaign.name);

      if (!response) {
        await markRun("failed", "Reddit request failed or was rate limited");
        continue;
      }

      const xml = await response.text();
      const parser = new XMLParser({
        attributeNamePrefix: "@_",
        ignoreAttributes: false,
        processEntities: false,
        htmlEntities: false,
        entityExpansionLimit: 1000000,
      });

      let feed: any;
      try {
        feed = parser.parse(xml);
      } catch (error) {
        console.error(
          `[Worker] Failed to parse Reddit feed for campaign ${campaign.name}:`,
          error,
        );
        await markRun("failed", "Feed parsing failed");
        continue;
      }

      const items = feed.feed?.entry || [];

      let matchedPosts = 0;

      for (const item of items) {
        const title = item.title || "";
        const content = item.content || "";
        const author = item.author?.name || "";
        const id = item.id || "";
        const url = item.link?.["@_href"] || "";
        const publishedAt = item.updated ? new Date(item.updated) : null;

        // Skip posts older than the campaign's time filter
        if (publishedAt && publishedAt < cutoffDate) continue;

        // 3. Pre-filter by negative keywords
        const negativeKeywords = keywords
          .filter((k: any) => k.isNegative)
          .map((k: any) => k.phrase.toLowerCase());

        const hasNegative = negativeKeywords.some(
          (kw: string) =>
            title.toLowerCase().includes(kw) ||
            content.toLowerCase().includes(kw),
        );

        if (hasNegative) continue;

        // Pre-filter by positive keywords (must have at least one if they exist)
        const campaignPositiveKeywords = keywords
          .filter((k: any) => !k.isNegative)
          .map((k: any) => k.phrase.toLowerCase());

        if (campaignPositiveKeywords.length > 0) {
          const hasPositive = campaignPositiveKeywords.some(
            (kw: string) =>
              title.toLowerCase().includes(kw) ||
              content.toLowerCase().includes(kw),
          );
          if (!hasPositive) continue;
        }

        matchedPosts++;

        // 4. AI Relevance Scoring (Groq)
        const score = await getAIRelevanceScore(
          env.GROQ_API_KEY,
          campaign,
          title,
          content,
        );

        if (score >= 70) {
          // 5. Save to leads
          await supabase.from("leads").upsert(
            {
              campaign_id: campaign.id,
              reddit_post_id: id,
              title,
              content,
              url,
              author,
              ai_relevance_score: score,
              status: "new",
            },
            { onConflict: "reddit_post_id" },
          );
        }
      }

      await markRun("success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(`[Worker] Campaign ${campaign.name} failed:`, error);
      await markRun("failed", message);
    }
  }
}

function buildSearchQuery(campaign: any, positiveKeywords: string[]) {
  const seedTerms = [
    ...positiveKeywords,
    ...(campaign.description
      ? campaign.description
          .toLowerCase()
          .split(/[^a-z0-9]+/)
          .filter(Boolean)
      : []),
    ...(campaign.targetDescription
      ? campaign.targetDescription
          .toLowerCase()
          .split(/[^a-z0-9]+/)
          .filter(Boolean)
      : []),
    ...(campaign.name
      ? campaign.name
          .toLowerCase()
          .split(/[^a-z0-9]+/)
          .filter(Boolean)
      : []),
  ];

  const extraTerms =
    campaign.leadType === "service"
      ? ["freelancer", "consultant", "hire", "service"]
      : ["saas", "software", "tool", "startup"];

  const terms = Array.from(new Set([...seedTerms, ...extraTerms]))
    .filter((term) => term.length > 2)
    .filter(
      (term) =>
        ![
          "the",
          "and",
          "for",
          "with",
          "that",
          "this",
          "your",
          "help",
          "looking",
        ].includes(term),
    )
    .slice(0, 6);

  if (terms.length === 0) {
    return "saas";
  }

  return terms.map((term) => `"${term.replace(/"/g, "")}"`).join(" OR ");
}

async function fetchRedditFeed(rssUrl: string, campaignName: string) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const response = await fetch(rssUrl, {
      headers: { "User-Agent": "EchoLeadsBot/1.1.0 (web3/worker)" },
    });

    if (response.ok) {
      return response;
    }

    if (response.status === 429 || response.status >= 500) {
      const retryAfterHeader = response.headers.get("retry-after");
      const retryAfterSeconds = Number.parseInt(retryAfterHeader ?? "", 10);
      const retryDelayMs = Math.min(
        30000,
        attempt * 4000 +
          (Number.isFinite(retryAfterSeconds) ? retryAfterSeconds * 1000 : 0),
      );

      console.warn(
        `[Worker] Reddit returned ${response.status} for campaign ${campaignName}; retry ${attempt}/3 in ${retryDelayMs}ms`,
      );

      if (attempt < 3) {
        await delay(retryDelayMs);
        continue;
      }
    }

    console.log(
      `[Worker] Reddit returned ${response.status} for campaign ${campaignName}`,
    );
    return null;
  }

  return null;
}

async function getAIRelevanceScore(
  apiKey: string,
  campaign: any,
  postTitle: string,
  postContent: string,
) {
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
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          messages: [{ role: "user", content: prompt }],
          temperature: 0,
        }),
      },
    );

    const data: any = await response.json();
    const text = data.choices[0].message.content.trim();
    return parseInt(text.replace(/[^0-9]/g, "")) || 0;
  } catch (err) {
    console.error("Groq API error:", err);
    return 0;
  }
}
