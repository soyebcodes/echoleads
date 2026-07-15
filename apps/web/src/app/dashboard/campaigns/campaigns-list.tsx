"use client";

import { useState } from "react";
import Link from "next/link";
import { deleteCampaign } from "@/app/actions/campaigns";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export default function CampaignsList({ initialCampaigns }: { initialCampaigns: any[] }) {
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  if (campaigns.length === 0) {
    return (
      <div className="bg-slate-900/40 backdrop-blur-sm border border-white/5 rounded-2xl p-12 text-center">
        <div className="max-w-sm mx-auto">
          <h2 className="text-xl font-semibold text-white mb-2">No campaigns yet</h2>
          <p className="text-slate-400 mb-6">Create your first campaign to start finding leads on Reddit.</p>
          <Link href="/dashboard/campaigns/new">
            <Button variant="outline" className="border-slate-700 text-slate-300">
              Create First Campaign
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {campaigns.map((campaign) => (
        <div key={campaign.id} className="bg-slate-900/40 backdrop-blur-sm border border-white/5 rounded-2xl p-6 hover:border-indigo-500/30 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold text-white group-hover:text-indigo-400 transition-colors">
              {campaign.name}
            </h3>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 rounded-md bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-wider">
                {campaign.leadType}
              </span>
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
          <div className="flex items-center justify-between pt-4 border-t border-white/5">
            <div className="flex gap-4">
              <div className="text-xs text-slate-500">
                <span className="text-white font-medium">0</span> Leads
              </div>
              <div className="text-xs text-slate-500">
                <span className="text-white font-medium">{campaign.timeFilterDays}d</span> Filter
              </div>
            </div>
            <Link href={`/dashboard/campaigns/${campaign.id}`} className="text-xs text-indigo-400 font-medium hover:text-indigo-300">
              View Details →
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
