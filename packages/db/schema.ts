import {
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
} from "drizzle-orm/pg-core";

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull().default(""),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const campaigns = pgTable("campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  leadType: text("lead_type").notNull(),
  timeFilterDays: integer("time_filter_days").default(7),
  minLikes: integer("min_likes").default(0),
  minComments: integer("min_comments").default(0),
  targetDescription: text("target_description"),
  excludeDescription: text("exclude_description"),
  lastRunAt: timestamp("last_run_at"),
  lastRunStatus: text("last_run_status"),
  lastRunError: text("last_run_error"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const keywords = pgTable("keywords", {
  id: serial("id").primaryKey(),
  campaignId: uuid("campaign_id").references(() => campaigns.id, {
    onDelete: "cascade",
  }),
  phrase: text("phrase").notNull(),
  isNegative: boolean("is_negative").default(false).notNull(),
});

export const voiceSamples = pgTable("voice_samples", {
  id: serial("id").primaryKey(),
  campaignId: uuid("campaign_id").references(() => campaigns.id, {
    onDelete: "cascade",
  }),
  samplePostContext: text("sample_post_context").notNull(),
  userReply: text("user_reply").notNull(),
});

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  campaignId: uuid("campaign_id").references(() => campaigns.id, {
    onDelete: "cascade",
  }),
  redditPostId: text("reddit_post_id").unique(),
  title: text("title").notNull(),
  content: text("content"),
  url: text("url").notNull(),
  author: text("author").notNull(),
  aiRelevanceScore: integer("ai_relevance_score").default(0),
  status: text("status").default("new"),
  createdAt: timestamp("created_at").defaultNow(),
});
