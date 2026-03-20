import { getCampaigns } from "@/app/actions/campaigns";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function CampaignsPage() {
  const campaigns = await getCampaigns();

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Campaigns</h1>
          <p className="text-slate-400">Manage your Reddit monitoring campaigns.</p>
        </div>
        <Link href="/dashboard/campaigns/new">
          <Button className="bg-indigo-600 hover:bg-indigo-500">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Campaign
          </Button>
        </Link>
      </div>

      {campaigns.length === 0 ? (
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="bg-slate-900/40 backdrop-blur-sm border border-white/5 rounded-2xl p-6 hover:border-indigo-500/30 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-white group-hover:text-indigo-400 transition-colors">
                  {campaign.name}
                </h3>
                <span className="px-2 py-1 rounded-md bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-wider">
                  {campaign.leadType}
                </span>
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
      )}
    </div>
  );
}
