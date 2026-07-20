"use client";

import { useMemo, useState } from "react";
import {
  generateAIResponse,
  markAsContacted,
  deleteLead,
} from "@/app/actions/leads";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ExternalLink, Search, Trash2 } from "lucide-react";

export default function LeadsTable({ initialLeads }: { initialLeads: any[] }) {
  const [leads, setLeads] = useState(initialLeads);
  const [generatingFor, setGeneratingFor] = useState<number | null>(null);
  const [draft, setDraft] = useState<{ [key: number]: string }>({});
  const [deletingId, setDeletingId] = useState<number | null>(null);

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
    if (!confirm("Remove this lead?")) return;
    setDeletingId(id);
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

  const handleSend = (id: number, username: string, text: string) => {
    markAsContacted(id);
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: "contacted" } : l)),
    );

    const subject = "Following up from r/someone's post";
    const url = `https://www.reddit.com/message/compose/?to=${username}&subject=${encodeURIComponent(subject)}&message=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-4">
      {leads.length === 0 ? (
        <Card className="p-16 flex flex-col items-center justify-center text-center bg-card border-border shadow-soft relative overflow-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
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
              appear here automatically when someone on Reddit creates a new
              post that matches your positive keywords.
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
        leads.map((lead) => (
          <div
            key={lead.id}
            className="bg-card border border-border rounded-xl p-6 shadow-soft transition-all hover:border-ember/30"
          >
            <div className="flex justify-between items-start gap-4 mb-4">
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-ember uppercase tracking-widest mb-1 block">
                  {lead.campaignName}
                </span>
                <h3 className="text-display text-lg font-semibold text-foreground mb-2 leading-snug">
                  {lead.title}
                </h3>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="rounded-full bg-surface px-2.5 py-1 text-foreground">
                    u/{lead.author}
                  </span>
                  <span className="rounded-full bg-surface px-2.5 py-1">
                    Match Score:{" "}
                    <span
                      className={
                        lead.aiRelevanceScore >= 90
                          ? "text-emerald-400 font-bold"
                          : "text-ember font-bold"
                      }
                    >
                      {lead.aiRelevanceScore}%
                    </span>
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
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
                    onClick={() => handleDelete(lead.id)}
                    disabled={deletingId === lead.id}
                    className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                    title="Remove lead"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <a
                  href={lead.url}
                  target="_blank"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View on Reddit
                </a>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-4 mb-6">
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
                Matched context
              </div>
              <p className="text-sm leading-7 text-foreground whitespace-pre-wrap">
                {sanitizeContent(lead.content)}
              </p>
            </div>

            {draft[lead.id] ? (
              <div className="mb-6 p-4 bg-ember-soft border border-ember/20 rounded-xl space-y-4">
                <p className="text-sm text-foreground leading-relaxed">
                  {draft[lead.id]}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() =>
                      handleSend(lead.id, lead.author, draft[lead.id])
                    }
                    className="bg-ember text-ember-foreground shadow-ember hover:bg-ember/90 h-9 px-4 text-xs"
                  >
                    Open Reddit DM
                  </Button>
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
        ))
      )}
    </div>
  );
}
