"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Bug, Lightbulb, MessageCircle, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import api from "@/lib/api";

type FeedbackType = "bug" | "feature" | "general";

const TYPES: { value: FeedbackType; label: string; description: string; icon: React.ElementType; color: string }[] = [
  {
    value: "bug",
    label: "Bug report",
    description: "Something isn't working",
    icon: Bug,
    color: "border-red-500/50 bg-red-500/5 text-red-400",
  },
  {
    value: "feature",
    label: "Feature request",
    description: "Suggest an improvement",
    icon: Lightbulb,
    color: "border-amber-500/50 bg-amber-500/5 text-amber-400",
  },
  {
    value: "general",
    label: "General feedback",
    description: "Anything else on your mind",
    icon: MessageCircle,
    color: "border-indigo-500/50 bg-indigo-500/5 text-indigo-400",
  },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeedbackModal({ open, onOpenChange }: Props) {
  const [type, setType] = useState<FeedbackType>("general");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      await api.post("/feedback", { type, message: message.trim() });
    },
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: () => {
      toast.error("Failed to submit feedback. Please try again.");
    },
  });

  const handleClose = (open: boolean) => {
    if (!open) {
      // Reset state when closing
      setTimeout(() => {
        setSubmitted(false);
        setMessage("");
        setType("general");
      }, 200);
    }
    onOpenChange(open);
  };

  const canSubmit = message.trim().length >= 10 && !mutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-900 border-slate-800 sm:max-w-md">
        {submitted ? (
          <div className="flex flex-col items-center justify-center py-8 text-center gap-4">
            <div className="h-14 w-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-7 w-7 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100">Thanks for your feedback!</h3>
              <p className="text-sm text-slate-400 mt-1">
                We read every submission and use it to improve Loopin.
              </p>
            </div>
            <Button
              className="mt-2 bg-indigo-600 hover:bg-indigo-700"
              onClick={() => handleClose(false)}
            >
              Close
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Share your feedback</DialogTitle>
              <DialogDescription>
                Help us improve Loopin — we read every submission.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 pt-1">
              {/* Type selector */}
              <div className="space-y-2">
                <Label className="text-xs uppercase text-slate-500 tracking-wide">Type</Label>
                <div className="grid grid-cols-3 gap-2">
                  {TYPES.map(({ value, label, description, icon: Icon, color }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setType(value)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-all",
                        type === value
                          ? color
                          : "border-slate-800 bg-slate-950 text-slate-500 hover:border-slate-700 hover:text-slate-400"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-xs font-medium leading-tight">{label}</span>
                      <span className="text-[10px] leading-tight opacity-70 hidden sm:block">{description}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="fb-message">Message</Label>
                <Textarea
                  id="fb-message"
                  placeholder={
                    type === "bug"
                      ? "Describe what happened and what you expected…"
                      : type === "feature"
                      ? "Describe the feature and why it would help you…"
                      : "What's on your mind?"
                  }
                  className="bg-slate-950 border-slate-800 min-h-28 resize-none"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={2000}
                />
                <p className="text-xs text-slate-500 text-right">
                  {message.length} / 2000
                  {message.trim().length > 0 && message.trim().length < 10 && (
                    <span className="ml-2 text-amber-400">Min 10 characters</span>
                  )}
                </p>
              </div>

              <Button
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                onClick={() => mutation.mutate()}
                disabled={!canSubmit}
              >
                {mutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {mutation.isPending ? "Sending…" : "Send feedback"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
