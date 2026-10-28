import type { LeadPlatform } from "@/lib/billing/plans";
import type { PlatformFetchParams, SourcePost } from "./types";

type AlgoliaHit = {
  objectID: string;
  author?: string;
  title?: string | null;
  story_title?: string | null;
  story_text?: string | null;
  comment_text?: string | null;
  url?: string | null;
  points?: number | null;
  num_comments?: number | null;
  created_at?: string | null;
};

type AlgoliaResponse = {
  nbHits?: number;
  hits?: AlgoliaHit[];
};

function stripHtml(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export async function fetchHackerNewsPosts(
  params: PlatformFetchParams,
): Promise<SourcePost[]> {
  const query = params.keywords.map((k) => `"${k}"`).join(" OR ");
  const since = Math.floor(Date.now() / 1000 - params.timeFilterDays * 86_400);

  const engagementFilters: string[] = [`created_at_i>${since}`];
  if (params.minLikes > 0) engagementFilters.push(`points>=${params.minLikes}`);
  if (params.minComments > 0) engagementFilters.push(`num_comments>=${params.minComments}`);

  const searchUrl = `https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent(query)}&tags=(story,comment)&numericFilters=${encodeURIComponent(engagementFilters.join(","))}&hitsPerPage=${Math.min(50, params.maxResults * 2)}`;

  const response = await fetch(searchUrl, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(`Hacker News search failed with status ${response.status}`);
  }

  const data = (await response.json()) as AlgoliaResponse;
  const hits = data.hits ?? [];

  const posts = hits
    .map((hit): SourcePost | null => {
      if (!hit.objectID) return null;
      const title = stripHtml(hit.title || hit.story_title || "");
      const content = stripHtml(hit.comment_text || hit.story_text || "");

      if (!title && !content) return null;

      return {
        platform: "hacker_news" as LeadPlatform,
        externalId: hit.objectID,
        title: title || content.slice(0, 100),
        content: content || null,
        url: `https://news.ycombinator.com/item?id=${hit.objectID}`,
        author: hit.author || "unknown",
        createdAt: hit.created_at ?? null,
        likes: hit.points ?? null,
        comments: hit.num_comments ?? null,
      };
    })
    .filter((post): post is SourcePost => post !== null);

  return posts.slice(0, params.maxResults);
}