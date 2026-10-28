import { db } from "@/lib/db";
import { campaigns, leads } from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

function csvCell(value: string | number | null | undefined): string {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const campaignId = url.searchParams.get("campaign_id");

  const conditions = [eq(campaigns.userId, user.id)];
  if (campaignId) {
    conditions.push(eq(leads.campaignId, campaignId));
  }

  const rows = await db
    .select({
      id: leads.id,
      platform: leads.platform,
      title: leads.title,
      content: leads.content,
      url: leads.url,
      author: leads.author,
      aiRelevanceScore: leads.aiRelevanceScore,
      aiScoreReason: leads.aiScoreReason,
      status: leads.status,
      createdAt: leads.createdAt,
      campaignName: campaigns.name,
    })
    .from(leads)
    .innerJoin(campaigns, eq(leads.campaignId, campaigns.id))
    .where(and(...conditions))
    .orderBy(desc(leads.createdAt));

  const header = [
    "Title",
    "Platform",
    "Author",
    "Match Score",
    "Status",
    "Campaign",
    "URL",
    "Why it matched",
    "Content",
    "Found at",
  ];

  const csvLines = [header.join(",")];
  for (const row of rows) {
    const content = (row.content ?? "").replace(/[\r\n]+/g, " ").slice(0, 500);
    csvLines.push(
      [
        csvCell(row.title),
        csvCell(row.platform),
        csvCell(row.author),
        csvCell(row.aiRelevanceScore ?? 0),
        csvCell(row.status ?? "new"),
        csvCell(row.campaignName),
        csvCell(row.url),
        csvCell(row.aiScoreReason ?? ""),
        csvCell(content),
        csvCell(row.createdAt ? row.createdAt.toISOString() : ""),
      ].join(","),
    );
  }

  const filename = `echoleads-${new Date().toISOString().slice(0, 10)}.csv`;
  return new Response(`\uFEFF${csvLines.join("\n")}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}