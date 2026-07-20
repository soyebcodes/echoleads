import { getCampaignById } from "@/app/actions/campaigns";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Target, MessageSquare, Key, Clock, ThumbsUp, MessageCircle } from "lucide-react";

export default async function CampaignDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await getCampaignById(id);

  if (!campaign) {
    notFound();
  }

  const positiveKeywords = campaign.keywords.filter(k => !k.isNegative);
  const negativeKeywords = campaign.keywords.filter(k => k.isNegative);

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/campaigns">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-display text-3xl font-bold tracking-tight">{campaign.name}</h1>
            <Badge variant="outline" className="text-ember border-ember/30 uppercase bg-ember-soft tracking-widest text-[10px]">
              {campaign.leadType}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            Created on {new Date(campaign.createdAt!).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Info Column */}
        <div className="md:col-span-2 space-y-8">
          
          {/* Overview */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-soft">
            <h2 className="text-display text-lg font-semibold mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-ember" /> Overview
            </h2>
            <div className="space-y-6">
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="text-foreground mt-1">{campaign.description || "N/A"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface p-4 rounded-lg border border-border">
                  <Label className="text-muted-foreground text-xs">Target Customer</Label>
                  <p className="text-foreground mt-1 text-sm">{campaign.targetDescription || "Anyone"}</p>
                </div>
                <div className="bg-surface p-4 rounded-lg border border-border">
                  <Label className="text-muted-foreground text-xs">Exclude Intent</Label>
                  <p className="text-foreground mt-1 text-sm">{campaign.excludeDescription || "None"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Keywords */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-soft">
            <h2 className="text-display text-lg font-semibold mb-4 flex items-center gap-2">
              <Key className="w-4 h-4 text-ember" /> Keywords Tracking
            </h2>
            <div className="space-y-6">
              <div>
                <Label className="text-muted-foreground mb-3 block">Tracking (Positive)</Label>
                <div className="flex flex-wrap gap-2">
                  {positiveKeywords.length > 0 ? (
                    positiveKeywords.map(kw => (
                      <span key={kw.id} className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-lg text-sm font-medium">
                        {kw.phrase}
                      </span>
                    ))
                  ) : (
                    <span className="text-muted-foreground italic text-sm">No positive keywords</span>
                  )}
                </div>
              </div>
              
              <div>
                <Label className="text-muted-foreground mb-3 block">Excluding (Negative)</Label>
                <div className="flex flex-wrap gap-2">
                  {negativeKeywords.length > 0 ? (
                    negativeKeywords.map(kw => (
                      <span key={kw.id} className="bg-red-500/10 border border-red-500/20 text-red-300 px-3 py-1 rounded-lg text-sm font-medium shadow-sm flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                        {kw.phrase}
                      </span>
                    ))
                  ) : (
                    <span className="text-muted-foreground italic text-sm">No negative keywords</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Voice Samples */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-soft">
            <h2 className="text-display text-lg font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-ember" /> AI Persona Samples
            </h2>
            <div className="space-y-4">
              {campaign.voiceSamples.map((sample, idx) => (
                <div key={sample.id} className="bg-surface border border-border rounded-lg p-5 space-y-4">
                  <div>
                     <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1 block">Context {idx + 1}</span>
                     <p className="text-foreground text-sm">"{sample.samplePostContext}"</p>
                  </div>
                  <div className="pl-4 border-l-2 border-ember">
                     <span className="text-xs text-ember uppercase font-bold tracking-wider mb-1 block">Your Replay Style</span>
                     <p className="text-foreground text-sm italic">"{sample.userReply}"</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 space-y-6 shadow-soft">
            <h2 className="text-display text-lg font-semibold mb-2">Filters</h2>
            
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" /> Recency
              </div>
              <span className="text-foreground font-medium">{campaign.timeFilterDays} Days</span>
            </div>
            
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2 text-muted-foreground">
                <ThumbsUp className="w-4 h-4" /> Min Likes
              </div>
              <span className="text-foreground font-medium">{campaign.minLikes}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MessageCircle className="w-4 h-4" /> Min Comments
              </div>
              <span className="text-foreground font-medium">{campaign.minComments}</span>
            </div>
          </div>

          <div className="bg-gradient-to-b from-ember-soft to-transparent border border-ember/20 rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-ember-soft rounded-lg flex items-center justify-center mx-auto mb-4">
               <Target className="w-6 h-6 text-ember" />
            </div>
            <h3 className="text-foreground font-bold mb-2">Campaign is Active</h3>
            <p className="text-muted-foreground text-sm mb-6">Our system is actively scanning Reddit for these keywords.</p>
            <Link href="/dashboard/leads">
               <Button className="w-full bg-ember text-ember-foreground shadow-ember hover:bg-ember/90 font-semibold">View Matches</Button>
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
