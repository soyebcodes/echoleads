"use client";

import { useState } from "react";
import Link from "next/link";
import {
  generateAIResponse,
  markAsContacted,
  deleteLead,
} from "@/app/actions/leads";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ExternalLink, Search, Trash2, Download } from "lucide-react";

type LeadItem = {
  id: number;
  platform: string;
  title: string;
  content: string | null;
  url: string;
  author: string;
  aiRelevanceScore: number | null;
  aiScoreReason?: string | null;
  status: string | null;
  campaignName: string;
};

type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

const PLATFORM_META: Record<string, { label: string; badge: string; viewLabel: string }> = {
  reddit: {
    label: "Reddit",
    badge: "bg-orange-500/10 text-orange-400 border border-orange-500/30",
    viewLabel: "View on Reddit",
  },
  x: {
    label: "X",
    badge: "bg-sky-500/10 text-sky-400 border border-sky-500/30",
    viewLabel: "View on X",
  },
  hacker_news: {
    label: "Hacker News",
    badge: "bg-yellow-500/10 text-yellow-500 dark:text-yellow-400 border border-yellow-500/30",
    viewLabel: "View on Hacker News",
  },
};

function platformMeta(platform: string) {
  return PLATFORM_META[platform] ?? {
    label: platform,
    badge: "bg-muted text-muted-foreground border border-border",
    viewLabel: "View post",
  };
}

function authorLabel(platform: string, author: string): string {
  if (platform === "reddit") return `u/${author}`;
  if (platform === "x") return `@${author}`;
  return author;
}

function normalizeUrl(lead: LeadItem): string {
  if (!lead.url) return "https://www.reddit.com";
  if (lead.url.startsWith("http")) return lead.url;
  return `https://www.reddit.com${lead.url.startsWith("/") ? lead.url : "/" + lead.url}`;
}

export default function LeadsTable({
  initialLeads,
  pagination,
  campaignId,
  basePath = "/dashboard/leads",
}: {
  initialLeads: LeadItem[];
  pagination: Pagination;
  campaignId?: string;
  basePath?: string;
}) {
  const [leads, setLeads] = useState(initialLeads);
  const [generatingFor, setGeneratingFor] = useState<number | null>(null);
  const [draft, setDraft] = useState<{ [key: number]: string }>({});
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const firstLeadNumber = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const lastLeadNumber = Math.min(pagination.page * pagination.pageSize, pagination.total);
  const previousHref = pagination.page > 2 ? `${basePath}?page=${pagination.page - 1}` : basePath;
  const nextHref = `${basePath}?page=${pagination.page + 1}`;
  const exportHref = campaignId
    ? `/api/leads/export?campaign_id=${campaignId}`
    : "/api/leads/export";

  const sanitizeContent = (value?: string | null) => {
    if (!value) return "No excerpt available yet.";

    const withoutTags = value
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, "&")
      .replace(/\s+/g, " ")
      .trim();

    if (!withoutTags) return "No excerpt available yet.";

    return withoutTags;
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    setConfirmDeleteId(null);
    await deleteLead(id);
    setLeads((prev) => prev.filter((l) => l.id !== id));
    setDeletingId(null);
  };

  const handleGenerate = async (id: number) => {
    setGeneratingFor(id);
    const text = await generateAIResponse(id);
    setDraft((prev) => ({ ...prev, [id]: text }));
    setGeneratingFor(null);
  };

  const handleSend = (lead: LeadItem, text: string) => {
    markAsContacted(lead.id);
    setLeads((prev) =>
      prev.map((l) => (l.id === lead.id ? { ...l, status: "contacted" } : l)),
    );

    const dmUrl =
      lead.platform === "reddit"
        ? `https://www.reddit.com/message/compose/?to=${encodeURIComponent(lead.author)}&subject=${encodeURIComponent("Quick question about your post")}&message=${encodeURIComponent(text)}`
        : normalizeUrl(lead);
    window.open(dmUrl, "_blank", "noopener,noreferrer");
  };

  const outreachCta = (lead: LeadItem) => {
    if (lead.platform === "reddit") return "Open Reddit DM";
    if (lead.platform === "x") return "Reply on X";
    return "Reply on Hacker News";
  };

  return (
    <div className="space-y-4">
      {pagination.total > 0 && (
        <div className="flex justify-end">
          <a
            href={exportHref}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </a>
        </div>
      )}

      <AlertDialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Remove Lead?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will permanently remove this lead from your inbox.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border text-foreground hover:bg-accent">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}
            >
              {deletingId ? "Removing…" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {leads.length === 0 ? (
        <Card className="p-8 sm:p-16 flex flex-col items-center justify-center text-center bg-card border-border shadow-soft relative overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 flex flex-col items-center"
          >
            <div className="w-24 h-24 bg-ember-soft rounded-full flex items-center justify-center mb-8 relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border-t-2 border-ember/40 border-r-2 border-transparent border-b-2 border-transparent border-l-2 border-transparent"
              />
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Search className="w-10 h-10 text-ember" />
              </motion.div>
            </div>
            <h3 className="text-display text-xl font-bold mb-2">
              Monitoring Active
            </h3>
            <p className="text-muted-foreground max-w-sm mx-auto text-sm leading-relaxed mb-6">
              Your AI worker is running silently in the background. Leads will
              appear here automatically when someone on Reddit or Hacker News
              creates a post that matches your positive keywords.
            </p>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="border-ember/30 text-ember hover:bg-ember-soft z-10"
            >
              Refresh Inbox
            </Button>
          </motion.div>

          <motion.div
            animate={{ opacity: [0.05, 0.15, 0.05], scale: [1, 1.2, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-ember/25 rounded-full blur-[80px] pointer-events-none"
          />
        </Card>
      ) : (
        leads.map((lead) => {
          const meta = platformMeta(lead.platform);
          return (
          <div
            key={lead.id}
            className="bg-card border border-border rounded-xl p-4 sm:p-6 shadow-soft transition-all hover:border-ember/30"
          >
            <div className="flex flex-col sm:flex-row sm:justify-between items-start gap-3 sm:gap-4 mb-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-ember uppercase tracking-widest">
                    {lead.campaignName}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${meta.badge}`}>
                    {meta.label}
                  </span>
                </div>
                <h3 className="text-display text-base sm:text-lg font-semibold text-foreground mb-2 leading-snug">
                  {lead.title}
                </h3>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="rounded-full bg-surface px-2.5 py-1 text-foreground">
                    {authorLabel(lead.platform, lead.author)}
                  </span>
                  <span className="rounded-full bg-surface px-2.5 py-1">
                    Match Score:{" "}
                    <span
                      className={
                        (lead.aiRelevanceScore ?? 0) >= 90
                          ? "text-emerald-400 font-bold"
                          : "text-ember font-bold"
                      }
                    >
                      {lead.aiRelevanceScore ?? 0}%
                    </span>
                  </span>
                </div>
              </div>
              <div className="flex w-full flex-row-reverse items-center justify-end gap-3 sm:w-auto sm:flex-col sm:items-end sm:gap-2 sm:shrink-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                      lead.status === "new"
                        ? "bg-ember-soft text-ember"
                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {lead.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(lead.id)}
                    disabled={deletingId === lead.id}
                    className="grid h-8 w-8 cursor-pointer place-items-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Remove lead"
                    title="Remove lead"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <a
                  href={normalizeUrl(lead)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {meta.viewLabel}
                </a>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-4 mb-4">
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
                Matched context
              </div>
              <p className="text-sm leading-7 text-foreground whitespace-pre-wrap">
                {sanitizeContent(lead.content)}
              </p>
              {lead.aiScoreReason ? (
                <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground italic">
                  Why it matched: {lead.aiScoreReason}
                </p>
              ) : null}
            </div>

            {draft[lead.id] ? (
              <div className="mb-2 p-4 bg-ember-soft border border-ember/20 rounded-xl space-y-4">
                <p className="text-sm text-foreground leading-relaxed">
                  {draft[lead.id]}
                </p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleSend(lead, draft[lead.id]);
                    }}
                    className="inline-flex items-center justify-center rounded-md bg-ember text-ember-foreground shadow-ember hover:bg-ember/90 h-9 px-4 text-xs font-medium transition-colors"
                  >
                    {outreachCta(lead)}
                  </a>
                  <Button
                    variant="ghost"
                    onClick={() => handleGenerate(lead.id)}
                    className="h-9 px-4 text-xs text-foreground hover:bg-accent"
                  >
                    Regenerate
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                disabled={generatingFor === lead.id}
                onClick={() => handleGenerate(lead.id)}
                className="border-border text-foreground hover:bg-accent h-10 px-6"
              >
                {generatingFor === lead.id
                  ? "Drafting AI Reply…"
                  : "Generate AI Reply"}
              </Button>
            )}
          </div>
          );
        })
      )}

      {pagination.total > 0 ? (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-soft sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{firstLeadNumber}</span>-
            <span className="font-medium text-foreground">{lastLeadNumber}</span> of{" "}
            <span className="font-medium text-foreground">{pagination.total}</span> leads
          </p>
          <div className="flex items-center gap-2">
            {pagination.page > 1 ? (
              <Link
                href={previousHref}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Link>
            ) : (
              <span className="inline-flex h-9 cursor-not-allowed items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-muted-foreground opacity-60">
                <ChevronLeft className="h-4 w-4" />
                Previous
              </span>
            )}
            <span className="rounded-lg bg-ember-soft px-3 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-ember">
              Page {pagination.page} / {pagination.totalPages}
            </span>
            {pagination.page < pagination.totalPages ? (
              <Link
                href={nextHref}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <span className="inline-flex h-9 cursor-not-allowed items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-muted-foreground opacity-60">
                <ChevronRight className="h-4 w-4" />
                Next
              </span>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}