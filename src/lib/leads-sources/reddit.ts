import { XMLParser } from "fast-xml-parser";
import type { LeadPlatform } from "@/lib/billing/plans";
import type { PlatformFetchParams, SourcePost } from "./types";

const USER_AGENT = "Mozilla/5.0 (compatible; EchoLeads/1.0; +https://echoleads.app)";

function recencyWindow(days: number): "day" | "week" | "month" | "year" {
  if (days <= 1) return "day";
  if (days <= 7) return "week";
  if (days <= 30) return "month";
  return "year";
}

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function stripHtml(value: string | undefined | null): string {
  if (!value) return "";
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#32;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function fetchRedditPosts(
  params: PlatformFetchParams,
): Promise<SourcePost[]> {
  const query = params.keywords.map((k) => `"${k}"`).join(" OR ");
  const url = `https://www.reddit.com/search.rss?q=${encodeURIComponent(query)}&sort=new&t=${recencyWindow(params.timeFilterDays)}`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/rss+xml, application/xml, text/xml",
    },
    signal: AbortSignal.timeout(15_000),
  });

  if (response.status === 429) {
    throw new Error("Reddit is rate-limiting requests (429). Try again in a few minutes.");
  }
  if (!response.ok) {
    throw new Error(`Reddit search failed with status ${response.status}`);
  }

  const xml = await response.text();
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
  });
  const parsed = parser.parse(xml) as Record<string, unknown>;
  const feed = parsed.feed as Record<string, unknown> | undefined;
  const entries = asArray(feed?.entry as Record<string, unknown> | Record<string, unknown>[]);

  return entries
    .map((entry): SourcePost | null => {
      const id = typeof entry.id === "string" ? entry.id : null;
      const link = entry.link as Record<string, string> | undefined;
      const href = link?.["@_href"];
      if (!id || !href) return null;

      const rawAuthor =
        (entry.author as Record<string, unknown> | undefined)?.name ?? "";
      const author = String(rawAuthor).replace(/^\/?u\//i, "").trim() || "unknown";

      const titleHtml = typeof entry.title === "string" ? entry.title : "";
      const contentHtml = typeof entry.content === "string" ? entry.content : "";

      return {
        platform: "reddit" as LeadPlatform,
        externalId: id,
        title: stripHtml(titleHtml) || "(untitled post)",
        content: stripHtml(contentHtml) || null,
        url: href,
        author,
        createdAt: typeof entry.published === "string" ? entry.published : null,
        likes: null,
        comments: null,
      };
    })
    .filter((post): post is SourcePost => post !== null)
    .slice(0, params.maxResults);
}