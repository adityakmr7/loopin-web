"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, MessageSquare, Zap, Activity } from "lucide-react";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden bg-slate-950">
      
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-900/20 blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium mb-8">
            <Zap className="h-3.5 w-3.5" />
            <span>Automate your Instagram growth</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6">
            Turn Comments into <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
              Conversations
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            Loopin helps you automatically reply to comments, send DMs, and engage with your audience 24/7. Never miss a lead again.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="h-12 px-8 text-lg bg-indigo-600 hover:bg-indigo-500 text-white rounded-full">
                Start Automating Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="h-12 px-8 text-lg border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white rounded-full bg-transparent">
                View Demo
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Floating Cards Animation */}
        <div className="relative mt-20 h-64 md:h-96 w-full max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="absolute left-1/2 -translate-x-1/2 top-0 z-20 w-fit"
          >
             <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-6 rounded-2xl shadow-2xl flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-indigo-600/20 flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-indigo-400" />
                </div>
                <div>
                  <div className="text-sm text-slate-400">Auto-Reply Triggered</div>
                  <div className="text-white font-medium">Sent you the link in DM! 🚀</div>
                </div>
             </div>
          </motion.div>

           <motion.div 
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="absolute right-[10%] top-[40%] z-10"
          >
             <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 p-4 rounded-2xl shadow-xl flex flex-col gap-2 w-48">
                <div className="flex items-center gap-2">
                   <Activity className="h-4 w-4 text-emerald-400" />
                   <span className="text-xs text-emerald-400 font-medium">+124% Engagement</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                   <div className="h-full w-3/4 bg-emerald-500 rounded-full" />
                </div>
             </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
