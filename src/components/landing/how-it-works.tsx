"use client";

import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Search, Zap, Filter, MessageSquare, Plus, Target, Users } from "lucide-react";
import Image from "next/image";

const keywords = [
  "remote designer", "no-code builder", "bubble app", "webflow project", 
  "saas onboarding", "getting users", "convert freemium", "ai assistant", 
  "automate tasks", "write with ai", "note taking app", "task manager", 
  "Notion alternative", "hiring ux", "design role", "productivity setup", 
  "remote ux job", "glide app", "freemium churn", "ai for teams", 
  "minimal notes", "figma freelance", "nocode tutorial", "user onboarding help", 
  "early startup hiring", "workflow automation", "simple task app", "startup design lead", 
  "bubble tutorial", "summarize with ai"
];

// Double the array for seamless infinite scrolling
const marqueeKeywords = [...keywords, ...keywords];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 md:py-32 bg-slate-950 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full -translate-y-1/2 pointer-events-none"></div>
      
      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        
        {/* Header Section */}
        <div className="text-center space-y-6 mb-24">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-indigo-300 font-medium tracking-wide uppercase">
            How It Works
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
            Find Your Next Customers in <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">3 Simple Steps</span>
          </h2>
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto">
            Get started for free and let EchoLeads put your lead generation on autopilot.
          </p>
        </div>

        {/* Steps Container */}
        <div className="space-y-32">
          
          {/* STEP 1 */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 order-2 md:order-1">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 text-indigo-400 font-bold text-xl">
                1
              </div>
              <h3 className="text-3xl font-bold text-white">Create a Campaign</h3>
              <p className="text-slate-400 text-lg leading-relaxed">
                Describe what you&#39;re offering, your target audience and select the platforms you want to monitor.
              </p>
            </div>
            
            {/* Step 1 UI Mockup */}
            <div className="order-1 md:order-2 bg-slate-900 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative">
              <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent rounded-3xl"></div>
              <div className="relative space-y-6 pointer-events-none">
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/5">
                  <div className="bg-indigo-500 p-2 rounded-lg"><Plus className="w-4 h-4 text-white" /></div>
                  <h4 className="text-white font-semibold">New Campaign</h4>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400 flex items-center gap-2"><Target className="w-4 h-4" /> What are you offering?</label>
                  <div className="bg-slate-950 border border-white/5 rounded-xl p-4 text-sm text-slate-300 leading-relaxed font-mono">
                    <span className="text-indigo-400">I&#39;m a freelance designer</span> available for one-time gigs like landing pages, onboarding flows, and app wireframes.
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400 flex items-center gap-2"><Users className="w-4 h-4" /> Who are you looking to reach?</label>
                  <div className="bg-slate-950 border border-white/5 rounded-xl p-4 text-sm text-slate-300 leading-relaxed font-mono">
                    I want to find teams asking for SEO help, outreach tools, or agencies to improve lead generation and funnel performance.
                  </div>
                </div>

                <div className="pt-2">
                  <label className="text-sm font-medium text-slate-400 mb-3 block">Platforms to monitor</label>
                  <div className="flex gap-3">
                    <div className="bg-white/5 border border-indigo-500/30 text-indigo-300 px-4 py-2 rounded-lg text-sm font-medium flex-1 text-center flex items-center justify-center gap-2">
                       <Image src="/reddit-logo.svg" alt="Reddit" width={16} height={16} /> Reddit
                    </div>
                    <div className="bg-white/5 border border-white/10 text-slate-400 px-4 py-2 rounded-lg text-sm font-medium flex-1 text-center flex items-center justify-center gap-2">
                       <Image src="/twitter-x-logo.svg" alt="X" width={14} height={14} className="invert opacity-50" /> X (Twitter)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 2 */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
             <div className="order-2 md:order-2 space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30 text-cyan-400 font-bold text-xl">
                2
              </div>
              <h3 className="text-3xl font-bold text-white">Add Keywords</h3>
              <p className="text-slate-400 text-lg leading-relaxed">
                Input the keywords and phrases your potential customers are using online. Think: product names, pain points, questions, competitor mentions.
              </p>
            </div>

            {/* Step 2 Marquee */}
            <div className="order-1 md:order-1 relative h-64 md:h-[400px] rounded-3xl border border-white/10 bg-slate-900 overflow-hidden flex items-center">
              <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-slate-900 to-transparent z-10"></div>
              <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-slate-900 to-transparent z-10"></div>
              
              <div className="flex flex-col gap-4 w-full -rotate-6 scale-110">
                 {/* Row 1 */}
                 <motion.div 
                   animate={{ x: [0, -1000] }}
                   transition={{ repeat: Infinity, ease: "linear", duration: 25 }}
                   className="flex gap-3 whitespace-nowrap"
                 >
                   {marqueeKeywords.map((kw, i) => (
                      <span key={`1-${i}`} className="bg-white/5 border border-white/10 text-slate-300 px-4 py-2 rounded-full text-sm font-medium shadow-sm">
                        {kw}
                      </span>
                   ))}
                 </motion.div>
                 {/* Row 2 (Reverse) */}
                 <motion.div 
                   animate={{ x: [-1000, 0] }}
                   transition={{ repeat: Infinity, ease: "linear", duration: 30 }}
                   className="flex gap-3 whitespace-nowrap"
                 >
                   {marqueeKeywords.reverse().map((kw, i) => (
                      <span key={`2-${i}`} className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-4 py-2 rounded-full text-sm font-medium shadow-sm">
                        {kw}
                      </span>
                   ))}
                 </motion.div>
                 {/* Row 3 */}
                 <motion.div 
                   animate={{ x: [0, -1000] }}
                   transition={{ repeat: Infinity, ease: "linear", duration: 20 }}
                   className="flex gap-3 whitespace-nowrap"
                 >
                   {marqueeKeywords.reverse().map((kw, i) => (
                      <span key={`3-${i}`} className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 px-4 py-2 rounded-full text-sm font-medium shadow-sm">
                        {kw}
                      </span>
                   ))}
                 </motion.div>
              </div>
            </div>
          </div>

          {/* STEP 3 */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 order-2 md:order-1">
              <div className="space-y-6">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30 text-purple-400 font-bold text-xl">
                  3
                </div>
                <h3 className="text-3xl font-bold text-white">We Scan the Internet - So You Don&#39;t Have To</h3>
                <p className="text-slate-400 text-lg leading-relaxed">
                  We scan the platforms daily for posts where people are asking for what you offer. When something relevant comes up, we&#39;ll send you a notification and you can easily outreach right away.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-white/10">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-white font-semibold"><Search className="w-4 h-4 text-indigo-400" /> Automated Daily Scans</div>
                  <p className="text-sm text-slate-500">We scan the platforms you selected every day so you never miss a lead.</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-white font-semibold"><Zap className="w-4 h-4 text-yellow-400" /> Real-time Notifications</div>
                  <p className="text-sm text-slate-500">Get notified by Email or Slack as soon as new leads are found.</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-white font-semibold"><Filter className="w-4 h-4 text-cyan-400" /> AI Lead Filtering</div>
                  <p className="text-sm text-slate-500">We use the newest AI models to analyze and filter leads, ensuring high relevance.</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-white font-semibold"><MessageSquare className="w-4 h-4 text-green-400" /> Generate & Send Replies</div>
                  <p className="text-sm text-slate-500">Generate engaging replies tailored to context and send them directly.</p>
                </div>
              </div>
            </div>

            {/* Step 3 UI Mockup */}
            <div className="order-1 md:order-2 relative bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-4">
              <div className="absolute -right-4 -top-4 bg-indigo-500 text-white text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 animate-pulse">
                <div className="w-1.5 h-1.5 rounded-full bg-white"></div> Live Feed
              </div>
              
              {/* Lead Card: Relevant */}
              <div className="bg-slate-950 border border-green-500/20 rounded-2xl p-4 flex flex-col gap-2 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500"></div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-green-400 font-bold bg-green-500/10 px-2 py-0.5 rounded">New Lead</span>
                  <span className="text-slate-500">Right now</span>
                </div>
                <p className="text-slate-300 text-sm font-medium">I want to build an app without coding. Is Bubble the best choice?</p>
              </div>

              {/* Lead Card: Not Relevant */}
              <div className="bg-slate-950/50 border border-white/5 rounded-2xl p-4 flex flex-col gap-2 opacity-50 grayscale">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-bold px-2 py-0.5 rounded border border-white/10">Not Relevant</span>
                  <span className="text-slate-600">5m ago</span>
                </div>
                <p className="text-slate-400 text-sm italic">Added dark mode to my SaaS today 😎 Small wins!</p>
              </div>

              {/* Lead Card: Relevant */}
              <div className="bg-slate-950 border border-green-500/20 rounded-2xl p-4 flex flex-col gap-2 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500"></div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-green-400 font-bold bg-green-500/10 px-2 py-0.5 rounded">New Lead</span>
                  <span className="text-slate-500">12m ago</span>
                </div>
                <p className="text-slate-300 text-sm font-medium">Anyone else struggling to get their first paying customers?</p>
              </div>
            </div>
          </div>
        </div>

        {/* Comparison Section */}
        <div className="mt-40 pt-24 border-t border-white/5 space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold text-white">Talk Only to People Who <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">Showed Interest</span></h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Forget burning money on ads — EchoLeads connects you directly with people actively looking for your product at a fraction of the cost.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Without */}
            <div className="bg-slate-900 border border-red-500/20 rounded-3xl p-8 space-y-6 flex flex-col">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="bg-red-500/10 text-red-400 p-1.5 rounded-lg"><XCircle className="w-5 h-5"/></span>
                Without EchoLeads
              </h3>
              <ul className="space-y-4 text-slate-400">
                <li className="flex items-start gap-3"><XCircle className="w-5 h-5 text-red-500/40 shrink-0 mt-0.5"/> Spend $$$ on ads with extremely low ROI</li>
                <li className="flex items-start gap-3"><XCircle className="w-5 h-5 text-red-500/40 shrink-0 mt-0.5"/> Waste 20+ hours/week doing manual lead research</li>
                <li className="flex items-start gap-3"><XCircle className="w-5 h-5 text-red-500/40 shrink-0 mt-0.5"/> Spamming people with cold emails that get ignored</li>
                <li className="flex items-start gap-3"><XCircle className="w-5 h-5 text-red-500/40 shrink-0 mt-0.5"/> Opportunities missed before you ever see them</li>
              </ul>
            </div>

            {/* With */}
            <div className="bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 border border-indigo-500/30 rounded-3xl p-8 space-y-6 flex flex-col relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-indigo-500/20 blur-[40px] rounded-full"></div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2 relative z-10">
                <span className="bg-indigo-500/20 text-indigo-400 p-1.5 rounded-lg"><CheckCircle2 className="w-5 h-5"/></span>
                With EchoLeads
              </h3>
              <ul className="space-y-4 text-slate-300 relative z-10 font-medium">
                <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5"/> Get only buying conversations at a fraction of ad spend</li>
                <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5"/> Set up a campaign in a minute & get new leads daily, automatically</li>
                <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5"/> Response rate increased by up to 90% with warm outreach</li>
                <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5"/> Get near real-time notifications so you can reply first and win</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
