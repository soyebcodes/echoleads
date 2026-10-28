import type { LeadPlatform } from "@/lib/billing/plans";
import { fetchRedditPosts } from "./reddit";
import { fetchHackerNewsPosts } from "./hackernews";
import { fetchXPosts } from "./x";
import {
  PlatformNotConfiguredError,
  type PlatformFetchParams,
  type SourcePost,
} from "./types";

export type { SourcePost, PlatformFetchParams } from "./types";
export { PlatformNotConfiguredError } from "./types";
export { isXConfigured } from "./x";

const FETCHERS: Record<
  LeadPlatform,
  (params: PlatformFetchParams) => Promise<SourcePost[]>
> = {
  reddit: fetchRedditPosts,
  hacker_news: fetchHackerNewsPosts,
  x: fetchXPosts,
};

export function isPlatformConfigured(platform: LeadPlatform): boolean {
  if (platform === "x") {
    return !!(process.env.X_BEARER_TOKEN || process.env.APIFY_API_TOKEN);
  }
  return true;
}

export async function fetchPlatformPosts(
  platform: LeadPlatform,
  params: PlatformFetchParams,
): Promise<SourcePost[]> {
  if (!isPlatformConfigured(platform)) {
    throw new PlatformNotConfiguredError(
      `${platform} is not configured on the server. Set X_BEARER_TOKEN or APIFY_API_TOKEN to enable X scanning.`,
    );
  }
  return FETCHERS[platform](params);
}