"use client";

import { useState } from "react";
import { generateAIResponse, markAsContacted } from "@/app/actions/leads";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export default function LeadsTable({ initialLeads }: { initialLeads: any[] }) {
  const [leads, setLeads] = useState(initialLeads);
  const [generatingFor, setGeneratingFor] = useState<number | null>(null);
  const [draft, setDraft] = useState<{ [key: number]: string }>({});

  const handleGenerate = async (id: number) => {
    setGeneratingFor(id);
    const text = await generateAIResponse(id);
    setDraft((prev) => ({ ...prev, [id]: text }));
    setGeneratingFor(null);
  };

  const handleSend = (id: number, username: string, text: string) => {
    markAsContacted(id);
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status: "contacted" } : l)));
    
    const subject = "Following up from r/someone's post";
    const url = `https://www.reddit.com/message/compose/?to=${username}&subject=${encodeURIComponent(subject)}&message=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-4">
      {leads.length === 0 ? (
        <Card className="p-12 text-center bg-slate-900/40 border-white/5">
           <p className="text-slate-500">No leads captured yet. Your worker will find them soon!</p>
        </Card>
      ) : (
        leads.map((lead) => (
          <div key={lead.id} className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 transition-all hover:border-indigo-500/20">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1 block">
                  {lead.campaignName}
                </span>
                <h3 className="text-lg font-semibold text-white mb-2">{lead.title}</h3>
                <div className="flex gap-4 text-xs text-slate-500">
                  <span>u/{lead.author}</span>
                  <span>Match Score: <span className={lead.aiRelevanceScore >= 90 ? "text-green-400 font-bold" : "text-indigo-400 font-bold"}>{lead.aiRelevanceScore}%</span></span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                 <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    lead.status === "new" ? "bg-indigo-500/10 text-indigo-400" : "bg-green-500/10 text-green-400"
                  }`}>
                    {lead.status}
                 </span>
                 <a href={lead.url} target="_blank" className="text-xs text-slate-500 hover:text-white underline">
                    View on Reddit
                 </a>
              </div>
            </div>

            <p className="text-slate-400 text-sm mb-6 line-clamp-3 italic">
              &ldquo;{lead.content}&rdquo;
            </p>

            {draft[lead.id] ? (
              <div className="mb-6 p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl space-y-4">
                <p className="text-sm text-indigo-200 leading-relaxed italic">&ldquo;{draft[lead.id]}&rdquo;</p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleSend(lead.id, lead.author, draft[lead.id])}
                    className="bg-indigo-600 hover:bg-indigo-500 h-9 px-4 text-xs"
                  >
                    Open Reddit DM
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => handleGenerate(lead.id)}
                    className="h-9 px-4 text-xs text-slate-400"
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
                className="border-slate-800 text-slate-300 hover:bg-white/5 h-10 px-6"
              >
                {generatingFor === lead.id ? "Drafting AI Reply…" : "Generate AI Reply"}
              </Button>
            )}
          </div>
        ))
      )}
    </div>
  );
}
