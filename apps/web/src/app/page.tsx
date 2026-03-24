"use client";

import { Navbar } from "@/components/navbar";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import Image from "next/image";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-indigo-500/30 overflow-x-hidden">
      <Navbar />
      
      <main className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6">
        {/* Background Ambient Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-full pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-[20%] right-[-5%] w-[30%] h-[30%] bg-cyan-500/10 blur-[100px] rounded-full"></div>
        </div>

        <div className="container mx-auto max-w-5xl relative z-10 text-center space-y-12">
          {/* Badge: Find People Looking for [Logos] */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center"
          >
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-4 py-1.5 rounded-full shadow-lg backdrop-blur-sm text-sm font-semibold tracking-wide text-indigo-300">
               <span className="uppercase text-[10px] tracking-[0.2em] opacity-70">Find People Looking for</span>
               <div className="flex items-center gap-3 ml-2 border-l border-white/10 pl-3">
                 <Image src="/twitter-x-logo.svg" alt="X" width={16} height={16} className="invert brightness-200" />
                 <Image src="/reddit-logo.svg" alt="Reddit" width={20} height={20} />
               </div>
            </div>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-6xl md:text-9xl font-black tracking-tighter leading-none bg-gradient-to-b from-white to-slate-500 bg-clip-text text-transparent"
          >
            What You Offer
          </motion.h1>

          {/* Core Copy */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-2xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium"
          >
            There are people on social media asking for tools and services every day. 
            <span className="text-white font-bold"> EchoLeads</span> scans the noise to find your next customer on autopilot.
          </motion.p>

          {/* Lead Gen Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-xl mx-auto space-y-8"
          >
            <div className="relative group">
               {/* Animated glow border effect */}
               <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 rounded-3xl blur opacity-20 group-focus-within:opacity-50 transition duration-700"></div>
               
               <div className="relative flex flex-col sm:flex-row gap-3 bg-slate-900/90 backdrop-blur-2xl border border-white/10 p-3 rounded-3xl shadow-3xl">
                  <Input 
                    placeholder="website.com (Optional)" 
                    className="bg-transparent border-none text-white placeholder:text-slate-500 focus-visible:ring-0 h-14 text-xl flex-1 px-5"
                  />
                  <Button className="bg-white text-black hover:bg-slate-200 h-14 px-10 rounded-2xl font-bold text-lg transition-all shadow-[0_0_30px_-5px_rgba(255,255,255,0.4)] hover:shadow-[0_0_40px_-5px_rgba(255,255,255,0.5)] active:scale-95">
                    Find My Leads
                  </Button>
               </div>
            </div>
            
            <p className="text-base text-slate-500 flex items-center justify-center gap-3 font-medium">
              <span>No charge today</span>
              <span className="w-1.5 h-1.5 bg-slate-800 rounded-full"></span>
              <span>Cancel anytime</span>
            </p>
          </motion.div>
        </div>
      </main>

      <HowItWorks />
    </div>
  );
}
