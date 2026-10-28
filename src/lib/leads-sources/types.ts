import type { LeadPlatform } from "@/lib/billing/plans";

export type SourcePost = {
  platform: LeadPlatform;
  externalId: string;
  title: string;
  content: string | null;
  url: string;
  author: string;
  createdAt?: string | null;
  likes?: number | null;
  comments?: number | null;
};

export type PlatformFetchParams = {
  keywords: string[];
  timeFilterDays: number;
  minLikes: number;
  minComments: number;
  maxResults: number;
};

export class PlatformNotConfiguredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlatformNotConfiguredError";
  }
}