import { getCampaignById } from "@/app/actions/campaigns";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Target, MessageSquare, Key, Clock, ThumbsUp, MessageCircle } from "lucide-react";

export default async function CampaignDetailsPage({ params }: { params: { id: string } }) {
  const campaign = await getCampaignById(params.id);

  if (!campaign) {
    notFound();
  }

  const positiveKeywords = campaign.keywords.filter(k => !k.isNegative);
  const negativeKeywords = campaign.keywords.filter(k => k.isNegative);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/campaigns">
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white tracking-tight">{campaign.name}</h1>
            <Badge variant="outline" className="text-indigo-400 border-indigo-500/30 uppercase bg-indigo-500/10 tracking-widest text-[10px]">
              {campaign.leadType}
            </Badge>
          </div>
          <p className="text-slate-400 mt-1 flex items-center gap-2">
            Created on {new Date(campaign.createdAt!).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Info Column */}
        <div className="md:col-span-2 space-y-8">
          
          {/* Overview */}
          <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-400" /> Overview
            </h2>
            <div className="space-y-6">
              <div>
                <Label className="text-slate-500">Description</Label>
                <p className="text-slate-300 mt-1">{campaign.description || "N/A"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-2xl border border-white/5">
                  <Label className="text-slate-500 text-xs">Target Customer</Label>
                  <p className="text-slate-300 mt-1 text-sm">{campaign.targetDescription || "Anyone"}</p>
                </div>
                <div className="bg-slate-950 p-4 rounded-2xl border border-white/5">
                  <Label className="text-slate-500 text-xs">Exclude Intent</Label>
                  <p className="text-slate-300 mt-1 text-sm">{campaign.excludeDescription || "None"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Keywords */}
          <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Key className="w-4 h-4 text-cyan-400" /> Keywords Tracking
            </h2>
            <div className="space-y-6">
              <div>
                <Label className="text-slate-500 mb-3 block">Tracking (Positive)</Label>
                <div className="flex flex-wrap gap-2">
                  {positiveKeywords.length > 0 ? (
                    positiveKeywords.map(kw => (
                      <span key={kw.id} className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-3 py-1 rounded-lg text-sm font-medium shadow-sm">
                        {kw.phrase}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-500 italic text-sm">No positive keywords</span>
                  )}
                </div>
              </div>
              
              <div>
                <Label className="text-slate-500 mb-3 block">Excluding (Negative)</Label>
                <div className="flex flex-wrap gap-2">
                  {negativeKeywords.length > 0 ? (
                    negativeKeywords.map(kw => (
                      <span key={kw.id} className="bg-red-500/10 border border-red-500/20 text-red-300 px-3 py-1 rounded-lg text-sm font-medium shadow-sm flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                        {kw.phrase}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-500 italic text-sm">No negative keywords</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Voice Samples */}
          <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-400" /> AI Persona Samples
            </h2>
            <div className="space-y-4">
              {campaign.voiceSamples.map((sample, idx) => (
                <div key={sample.id} className="bg-slate-950 border border-white/10 rounded-2xl p-5 space-y-4">
                  <div>
                     <span className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1 block">Context {idx + 1}</span>
                     <p className="text-slate-300 text-sm">"{sample.samplePostContext}"</p>
                  </div>
                  <div className="pl-4 border-l-2 border-indigo-500">
                     <span className="text-xs text-indigo-400 uppercase font-bold tracking-wider mb-1 block">Your Replay Style</span>
                     <p className="text-slate-300 text-sm italic">"{sample.userReply}"</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 space-y-6">
            <h2 className="text-lg font-semibold text-white mb-2">Filters</h2>
            
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <div className="flex items-center gap-2 text-slate-400">
                <Clock className="w-4 h-4" /> Recency
              </div>
              <span className="text-white font-medium">{campaign.timeFilterDays} Days</span>
            </div>
            
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <div className="flex items-center gap-2 text-slate-400">
                <ThumbsUp className="w-4 h-4" /> Min Likes
              </div>
              <span className="text-white font-medium">{campaign.minLikes}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-400">
                <MessageCircle className="w-4 h-4" /> Min Comments
              </div>
              <span className="text-white font-medium">{campaign.minComments}</span>
            </div>
          </div>

          <div className="bg-gradient-to-b from-indigo-500/10 to-transparent border border-indigo-500/20 rounded-3xl p-6 text-center">
            <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
               <Target className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="text-white font-bold mb-2">Campaign is Active</h3>
            <p className="text-slate-400 text-sm mb-6">Our system is actively scanning Reddit for these keywords.</p>
            <Link href="/dashboard/leads">
               <Button className="w-full bg-white text-black hover:bg-slate-200 font-semibold rounded-xl">View Matches</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode, className?: string }) {
  return <label className={`block text-xs font-semibold tracking-wider uppercase mb-1 ${className || ''}`}>{children}</label>;
}
