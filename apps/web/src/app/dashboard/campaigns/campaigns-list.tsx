"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteCampaign, runCampaignNow } from "@/app/actions/campaigns";
import { getCampaignLeadCount } from "@/app/actions/leads";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Trash2, PlayCircle, Clock3, Loader2 } from "lucide-react";

export default function CampaignsList({
  initialCampaigns,
}: {
  initialCampaigns: any[];
}) {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [scanCampaign, setScanCampaign] = useState<any | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [findingMatches, setFindingMatches] = useState(false);
  const [scanFoundResults, setScanFoundResults] = useState(false);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, []);

  const stopPolling = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  const handleRunNow = async (id: string) => {
    const campaign = campaigns.find((item) => item.id === id);
    setRunningId(id);
    setScanCampaign(campaign ?? null);
    setScanModalOpen(true);
    setScanProgress(8);
    setFindingMatches(false);
    setScanFoundResults(false);
    setCampaigns((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              lastRunStatus: "running",
              lastRunAt: new Date().toISOString(),
              lastRunError: null,
            }
          : item,
      ),
    );

    try {
      await runCampaignNow(id);
      const initialLeadCount = campaign?.leadCount ?? 0;
      let attempts = 0;

      stopPolling();
      pollTimerRef.current = setInterval(async () => {
        attempts += 1;
        setScanProgress(Math.min(92, Math.round((attempts / 12) * 100)));
        setFindingMatches(attempts >= 4);
        const freshCount = await getCampaignLeadCount(id);

        if (freshCount > initialLeadCount) {
          stopPolling();
          setScanProgress(100);
          setFindingMatches(false);
          setScanFoundResults(true);
          toast.success("Fresh leads are ready.");
          return;
        }

        if (attempts >= 12) {
          stopPolling();
          setCampaigns((prev) =>
            prev.map((item) =>
              item.id === id
                ? {
                    ...item,
                    lastRunStatus: "success",
                    lastRunError: "No new leads were found yet.",
                  }
                : item,
            ),
          );
          setScanProgress(100);
          setFindingMatches(false);
          setScanFoundResults(false);
          setScanModalOpen(false);
          toast.info(
            "No new leads were found yet. You can open the inbox manually.",
          );
        }
      }, 2000);
    } catch {
      setCampaigns((prev) =>
        prev.map((campaignItem) =>
          campaignItem.id === id
            ? {
                ...campaignItem,
                lastRunStatus: "failed",
                lastRunError: "Could not start scan.",
              }
            : campaignItem,
        ),
      );
      stopPolling();
      setScanProgress(0);
      setFindingMatches(false);
      setScanFoundResults(false);
      setScanModalOpen(false);
      toast.error("Could not start scan.");
    } finally {
      setRunningId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this campaign? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await deleteCampaign(id);
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
      toast.success("Campaign deleted.");
    } catch {
      toast.error("Failed to delete campaign.");
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status?: string | null) => {
    if (!status) {
      return {
        label: "Not run",
        className: "bg-slate-700/60 text-slate-300 border border-slate-600/60",
      };
    }

    if (status === "running") {
      return {
        label: "Running",
        className: "bg-amber-500/15 text-amber-300 border border-amber-500/30",
      };
    }

    if (status === "success") {
      return {
        label: "Succeeded",
        className:
          "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
      };
    }

    return {
      label: "Failed",
      className: "bg-rose-500/15 text-rose-300 border border-rose-500/30",
    };
  };

  if (campaigns.length === 0) {
    return (
      <div className="bg-slate-900/40 backdrop-blur-sm border border-white/5 rounded-2xl p-12 text-center">
        <div className="max-w-sm mx-auto">
          <h2 className="text-xl font-semibold text-white mb-2">
            No campaigns yet
          </h2>
          <p className="text-slate-400 mb-6">
            Create your first campaign to start finding leads on Reddit.
          </p>
          <Link href="/dashboard/campaigns/new">
            <Button
              variant="outline"
              className="border-slate-700 text-slate-300"
            >
              Create First Campaign
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Dialog open={scanModalOpen} onOpenChange={setScanModalOpen}>
        <DialogContent className="sm:max-w-lg border-slate-800 bg-slate-950/95">
          <DialogHeader>
            <DialogTitle className="text-white">Scanning for leads</DialogTitle>
            <DialogDescription className="text-slate-400">
              {scanCampaign?.name
                ? `We’ve started a fresh scan for ${scanCampaign.name}. If we find matching leads, you’ll be taken straight to your inbox.`
                : "We’ve started a fresh scan. If we find matching leads, you’ll be taken straight to your inbox."}
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-2xl border border-indigo-500/20 bg-slate-900/70 p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Loader2
                  className={`h-5 w-5 ${scanFoundResults ? "text-emerald-400" : "animate-spin text-indigo-400"}`}
                />
                <div>
                  <div className="text-sm font-medium text-white">
                    {scanFoundResults
                      ? "We found fresh lead matches."
                      : findingMatches
                        ? "Finding matches…"
                        : "Looking through Reddit for high-intent posts..."}
                  </div>
                  <div className="text-sm text-slate-400">
                    {scanFoundResults
                      ? "Your scan surfaced new opportunities. Open the inbox to review them now."
                      : "This can take a little while. We’ll keep checking in the background and surface the results as soon as they appear."}
                  </div>
                </div>
              </div>
              <div className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-indigo-300 flex items-center gap-2 shrink-0">
                <span
                  className={`h-2 w-2 rounded-full ${scanFoundResults ? "bg-emerald-400" : "bg-indigo-400 animate-pulse"}`}
                />
                {scanFoundResults
                  ? "Results ready"
                  : findingMatches
                    ? "Scanning live"
                    : "In progress"}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-500">
                <span>Progress</span>
                <span>{scanProgress}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${scanFoundResults ? "bg-emerald-500" : "bg-indigo-500"}`}
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                className="border-slate-700 text-slate-300"
                onClick={() => setScanModalOpen(false)}
              >
                {scanFoundResults ? "Close" : "Keep browsing"}
              </Button>
              {scanFoundResults ? (
                <Button
                  className="bg-emerald-600 hover:bg-emerald-500"
                  onClick={() => router.push("/dashboard/leads")}
                >
                  View leads
                </Button>
              ) : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {campaigns.map((campaign) => (
          <div
            key={campaign.id}
            className="bg-slate-900/40 backdrop-blur-sm border border-white/5 rounded-2xl p-6 hover:border-indigo-500/30 transition-all group"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white group-hover:text-indigo-400 transition-colors">
                  {campaign.name}
                </h3>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${getStatusBadge(campaign.lastRunStatus).className}`}
                  >
                    {getStatusBadge(campaign.lastRunStatus).label}
                  </span>
                  <span className="px-2 py-1 rounded-md bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-wider">
                    {campaign.leadType}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    onClick={() => handleRunNow(campaign.id)}
                    disabled={runningId === campaign.id}
                    className="text-slate-400 hover:text-indigo-400 transition-colors disabled:opacity-50"
                    title="Run scan now"
                  >
                    <PlayCircle className="w-4 h-4" />
                  </button>
                  {runningId === campaign.id ? (
                    <span className="absolute -top-2 -right-2 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-amber-300 border border-amber-500/30">
                      Scan
                    </span>
                  ) : null}
                </div>
                <button
                  onClick={() => handleDelete(campaign.id)}
                  disabled={deletingId === campaign.id}
                  className="text-slate-600 hover:text-red-400 transition-colors disabled:opacity-50"
                  title="Delete campaign"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-slate-400 text-sm line-clamp-2 mb-6">
              {campaign.description || "No description provided."}
            </p>
            <div className="pt-4 border-t border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex gap-4">
                  <div className="text-xs text-slate-500">
                    <span className="text-white font-medium">
                      {campaign.leadCount ?? 0}
                    </span>{" "}
                    Leads
                  </div>
                  <div className="text-xs text-slate-500">
                    <span className="text-white font-medium">
                      {campaign.timeFilterDays}d
                    </span>{" "}
                    Filter
                  </div>
                </div>
                <div className="text-right text-[11px] text-slate-400">
                  <div className="flex items-center justify-end gap-1 text-slate-300">
                    <Clock3 className="w-3.5 h-3.5" />
                    {campaign.lastRunAt
                      ? new Date(campaign.lastRunAt).toLocaleString()
                      : "Not run yet"}
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-white/5 bg-slate-950/40 p-3">
                <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500 mb-1">
                  Scan history
                </div>
                <div className="text-sm text-slate-300">
                  {campaign.lastRunStatus
                    ? `${getStatusBadge(campaign.lastRunStatus).label} • ${campaign.lastRunAt ? new Date(campaign.lastRunAt).toLocaleString() : "pending"}`
                    : "No scan history yet"}
                  {campaign.lastRunError ? (
                    <div className="mt-1 text-xs text-rose-300">
                      {campaign.lastRunError}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="flex justify-end">
                <Link
                  href={`/dashboard/campaigns/${campaign.id}`}
                  className="text-xs text-indigo-400 font-medium hover:text-indigo-300"
                >
                  View Details →
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
