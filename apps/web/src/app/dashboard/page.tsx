import { createClient } from "@/lib/supabase/server";
import { getCampaigns } from "@/app/actions/campaigns";
import { getLeads } from "@/app/actions/leads";
import Link from "next/link";
import { ArrowRight, Activity, Target } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const campaigns = await getCampaigns();
  const leads = await getLeads();

  const totalCampaigns = campaigns.length;
  const totalLeads = leads.length;
  const contactedLeads = leads.filter(l => l.status === "contacted").length;
  const conversionRate = totalLeads > 0 ? Math.round((contactedLeads / totalLeads) * 100) : 0;

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {user?.email?.split('@')[0]}</h1>
        <p className="text-slate-400">Here&apos;s an overview of your lead generation performance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Active Campaigns", value: totalCampaigns.toString(), sub: `${totalCampaigns} running` },
          { label: "Total Leads", value: totalLeads.toString(), sub: `${totalLeads} found` },
          { label: "Conversion Rate", value: `${conversionRate}%`, sub: `${contactedLeads} contacted` },
        ].map((stat, i) => (
          <div key={i} className="bg-slate-900/40 backdrop-blur-sm border border-white/5 rounded-2xl p-6">
            <p className="text-slate-400 text-sm font-medium mb-1">{stat.label}</p>
            <p className="text-3xl font-bold text-white mb-2">{stat.value}</p>
            <p className="text-xs text-indigo-400/80">{stat.sub}</p>
          </div>
        ))}
      </div>

      {totalCampaigns === 0 ? (
        <div className="bg-slate-900/40 backdrop-blur-sm border border-white/5 rounded-2xl p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-indigo-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">No active campaigns</h2>
            <p className="text-slate-400 mb-6">Create your first campaign to start monitoring Reddit for high-intent leads.</p>
            <Link
              href="/dashboard/campaigns/new"
              className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl px-6 py-3 transition-colors"
            >
              Create Campaign
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/40 backdrop-blur-sm border border-white/5 rounded-2xl p-8">
           <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                 <Activity className="w-5 h-5 text-indigo-400" /> Recent Activity
              </h2>
              <Link href="/dashboard/leads" className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                 View all leads <ArrowRight className="w-4 h-4" />
              </Link>
           </div>
           
           {leads.length > 0 ? (
             <div className="space-y-4">
               {leads.slice(0, 3).map((lead) => (
                 <div key={lead.id} className="flex justify-between items-center p-4 bg-slate-950 rounded-xl border border-white/5">
                   <div>
                     <p className="text-white font-medium mb-1 line-clamp-1">{lead.title}</p>
                     <p className="text-xs text-slate-500">From campaign: <span className="text-indigo-400">{lead.campaignName}</span></p>
                   </div>
                   <div className="text-right">
                     <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        lead.status === "new" ? "bg-indigo-500/10 text-indigo-400" : "bg-green-500/10 text-green-400"
                      }`}>
                        {lead.status}
                     </span>
                   </div>
                 </div>
               ))}
             </div>
           ) : (
             <div className="text-center py-8">
               <p className="text-slate-500 text-sm">No leads found yet. Your worker is scanning...</p>
             </div>
           )}
        </div>
      )}
    </div>
  );
}
