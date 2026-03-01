"use client";

import Link from "next/link";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UpgradePromptProps {
  message?: string;
}

export function UpgradePrompt({ message = "You've reached your plan limit." }: UpgradePromptProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm">
      <Zap className="h-4 w-4 text-amber-400 shrink-0" />
      <span className="text-amber-300">{message}</span>
      <Button asChild size="sm" className="ml-auto bg-amber-500 hover:bg-amber-400 text-black shrink-0">
        <Link href="/billing">Upgrade</Link>
      </Button>
    </div>
  );
}
