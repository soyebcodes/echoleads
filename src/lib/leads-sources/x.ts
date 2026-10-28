import type { LeadPlatform } from "@/lib/billing/plans";
import {
  PlatformNotConfiguredError,
  type PlatformFetchParams,
  type SourcePost,
} from "./types";

type TwitterUser = { id?: string; username?: string };

type TwitterSearchResponse = {
  data?: Array<{
    id: string;
    text: string;
    author_id?: string;
    created_at?: string;
    public_metrics?: {
      like_count?: number;
      reply_count?: number;
      retweet_count?: number;
    };
  }>;
  includes?: { users?: TwitterUser[] };
  title?: string;
  detail?: string;
};

type ApifyTweet = {
  id?: string;
  text?: string;
  url?: string;
  likeCount?: number;
  replyCount?: number;
  createdAt?: string;
  author?: { userName?: string; name?: string } | null;
  author_meta?: { userName?: string; name?: string } | null;
};

export function isXConfigured(): boolean {
  return !!(process.env.X_BEARER_TOKEN || process.env.APIFY_API_TOKEN);
}

async function fetchXViaOfficialApi(
  params: PlatformFetchParams,
): Promise<SourcePost[]> {
  const token = process.env.X_BEARER_TOKEN;
  if (!token) {
    throw new PlatformNotConfiguredError(
      "X is not configured. Set X_BEARER_TOKEN or APIFY_API_TOKEN.",
    );
  }

  const query = params.keywords.map((k) => `"${k}" -is:retweet`).join(" OR ");
  const windowDays = Math.min(params.timeFilterDays, 7);
  const url = new URL("https://api.x.com/2/tweets/search/recent");
  url.searchParams.set("query", query);
  url.searchParams.set("max_results", String(Math.min(25, params.maxResults * 2)));
  url.searchParams.set("sort_order", "recency");
  url.searchParams.set("tweet.fields", "created_at,public_metrics,author_id");
  url.searchParams.set("expansions", "author_id");
  url.searchParams.set("user.fields", "username");

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "EchoLeads/1.0",
    },
    signal: AbortSignal.timeout(20_000),
  });

  const data = (await response.json()) as TwitterSearchResponse;

  if (!response.ok) {
    throw new Error(
      `X API search failed (${response.status}): ${data.title || data.detail || "unknown error"}`,
    );
  }

  const usersById = new Map<string, string>();
  for (const user of data.includes?.users ?? []) {
    if (user.id && user.username) usersById.set(user.id, user.username);
  }

  return (data.data ?? [])
    .filter((tweet) => {
      const likes = tweet.public_metrics?.like_count ?? 0;
      const replies = tweet.public_metrics?.reply_count ?? 0;
      if (windowDays < params.timeFilterDays) return true;
      return likes >= params.minLikes && replies >= params.minComments;
    })
    .map((tweet) => {
      const username = usersById.get(tweet.author_id ?? "") ?? "unknown";
      return {
        platform: "x" as LeadPlatform,
        externalId: tweet.id,
        title: tweet.text.replace(/\s+/g, " ").slice(0, 120),
        content: tweet.text,
        url: `https://x.com/${username}/status/${tweet.id}`,
        author: username,
        createdAt: tweet.created_at ?? null,
        likes: tweet.public_metrics?.like_count ?? null,
        comments: tweet.public_metrics?.reply_count ?? null,
      };
    })
    .slice(0, params.maxResults);
}

async function fetchXViaApify(
  params: PlatformFetchParams,
): Promise<SourcePost[]> {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) {
    throw new PlatformNotConfiguredError(
      "X is not configured. Set X_BEARER_TOKEN or APIFY_API_TOKEN.",
    );
  }

  const actorId = process.env.APIFY_X_ACTOR_ID || "apido~tweet-scraper";
  const since = new Date(Date.now() - params.timeFilterDays * 86_400)
    .toISOString()
    .replace(/\.000Z$/, "Z");

  const input = {
    searchTerms: params.keywords,
    sort: "Latest",
    maxItems: Math.min(50, params.maxResults * 2),
    since: since,
  };

  const response = await fetch(
    `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(90_000),
    },
  );

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Apify X scraper failed (${response.status}): ${text.slice(0, 200)}`);
  }

  const tweets = (await response.json()) as ApifyTweet[];

  const posts: SourcePost[] = [];
  for (const tweet of tweets) {
    const id = tweet.id ?? "";
    const text = (tweet.text ?? "").replace(/\s+/g, " ").trim();
    if (!id || !text) continue;

    const likes = tweet.likeCount ?? 0;
    const replies = tweet.replyCount ?? 0;
    if ((likes > 0 || replies > 0) && (likes < params.minLikes || replies < params.minComments)) {
      continue;
    }

    const username =
      tweet.author?.userName || tweet.author_meta?.userName || "unknown";

    posts.push({
      platform: "x",
      externalId: id,
      title: text.slice(0, 120),
      content: text,
      url: tweet.url || `https://x.com/${username}/status/${id}`,
      author: username,
      createdAt: tweet.createdAt ?? null,
      likes: tweet.likeCount ?? null,
      comments: tweet.replyCount ?? null,
    });
  }

  return posts.slice(0, params.maxResults);
}

export async function fetchXPosts(
  params: PlatformFetchParams,
): Promise<SourcePost[]> {
  if (process.env.X_BEARER_TOKEN) {
    return fetchXViaOfficialApi(params);
  }
  return fetchXViaApify(params);
}