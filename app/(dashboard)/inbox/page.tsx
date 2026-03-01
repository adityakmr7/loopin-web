"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useConversations, useMessages, useSendReply, useResolveConversation, usePauseAutomation, useResumeAutomation } from "@/hooks/useInbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import api from "@/lib/api";
import { formatDistanceToNow, parseISO, format } from "date-fns";
import { MessageSquare, Send, CheckCheck, PauseCircle, PlayCircle, Loader2, Bot, BotOff } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Account { id: string; username: string; }

export default function InboxPage() {
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [tab, setTab] = useState<"open" | "resolved">("open");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: accounts } = useQuery<Account[]>({
    queryKey: ["instagram", "accounts"],
    queryFn: async () => {
      const { data } = await api.get("/instagram/accounts");
      return data.data || [];
    },
  });

  const accountId = selectedAccountId || accounts?.[0]?.id;
  const { data: conversations, isLoading: loadingConvos } = useConversations(accountId, tab === "resolved");
  const { data: messages, isLoading: loadingMessages } = useMessages(activeConversationId ?? undefined);

  const sendReply = useSendReply();
  const resolveConversation = useResolveConversation();
  const pauseAutomation = usePauseAutomation();
  const resumeAutomation = useResumeAutomation();

  const activeConversation = conversations?.find((c) => c.id === activeConversationId);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!activeConversationId || !replyText.trim()) return;
    try {
      await sendReply.mutateAsync({ conversationId: activeConversationId, text: replyText.trim() });
      setReplyText("");
    } catch {
      toast.error("Failed to send reply");
    }
  };

  const handleResolve = async () => {
    if (!activeConversationId) return;
    try {
      await resolveConversation.mutateAsync(activeConversationId);
      toast.success("Conversation resolved");
      setActiveConversationId(null);
    } catch {
      toast.error("Failed to resolve");
    }
  };

  const handlePauseToggle = async () => {
    if (!activeConversationId || !activeConversation) return;
    try {
      if (activeConversation.automationPaused) {
        await resumeAutomation.mutateAsync(activeConversationId);
        toast.success("Automation resumed");
      } else {
        await pauseAutomation.mutateAsync(activeConversationId);
        toast.success("Automation paused — you're in control");
      }
    } catch {
      toast.error("Failed to update automation state");
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex gap-0 -mx-8 -my-8">

      {/* Conversation list */}
      <div className="w-72 border-r border-slate-800 flex flex-col bg-slate-950 shrink-0">
        <div className="p-4 border-b border-slate-800 space-y-3">
          <h2 className="font-semibold text-slate-100">Inbox</h2>

          {accounts && accounts.length > 1 && (
            <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
              <SelectTrigger className="h-8 text-xs bg-slate-900 border-slate-800">
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>@{a.username}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Tabs */}
          <div className="flex rounded-lg bg-slate-900 p-1 gap-1">
            {(["open", "resolved"] as const).map((t) => (
              <button
                key={t}
                className={cn(
                  "flex-1 text-xs py-1 rounded-md transition-colors capitalize",
                  tab === t ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
                )}
                onClick={() => { setTab(t); setActiveConversationId(null); }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConvos ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
            </div>
          ) : !conversations || conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <MessageSquare className="h-8 w-8 opacity-20 mb-3" />
              <p className="text-sm text-slate-500">No {tab} conversations</p>
            </div>
          ) : (
            conversations.map((convo) => (
              <button
                key={convo.id}
                className={cn(
                  "w-full text-left px-4 py-3 border-b border-slate-800 transition-colors",
                  activeConversationId === convo.id
                    ? "bg-indigo-600/10 border-l-2 border-l-indigo-500"
                    : "hover:bg-slate-900"
                )}
                onClick={() => setActiveConversationId(convo.id)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-200 truncate">
                    @{convo.participantUsername ?? convo.participantIgId}
                  </span>
                  {convo.lastMessageAt && (
                    <span className="text-xs text-slate-500 shrink-0 ml-2">
                      {formatDistanceToNow(parseISO(convo.lastMessageAt), { addSuffix: false })}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 truncate">{convo.lastMessageText ?? "No messages yet"}</p>
                {convo.automationPaused && (
                  <span className="inline-flex items-center gap-1 mt-1 text-xs text-amber-400">
                    <BotOff className="h-3 w-3" /> Paused
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Message thread */}
      <div className="flex-1 flex flex-col min-w-0">
        {!activeConversationId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
            <MessageSquare className="h-12 w-12 opacity-20 mb-4" />
            <p className="text-lg font-medium text-slate-400">Select a conversation</p>
            <p className="text-sm mt-1">Choose a conversation from the left to view messages</p>
          </div>
        ) : (
          <>
            {/* Thread header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
              <div>
                <p className="font-semibold text-slate-100">
                  @{activeConversation?.participantUsername ?? activeConversation?.participantIgId}
                </p>
                {activeConversation?.automationPaused && (
                  <p className="text-xs text-amber-400 flex items-center gap-1 mt-0.5">
                    <BotOff className="h-3 w-3" /> Automation paused — you&apos;re in control
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "gap-1.5 border-slate-700 text-xs",
                    activeConversation?.automationPaused
                      ? "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10 border-emerald-500/30"
                      : "text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 border-amber-500/30"
                  )}
                  onClick={handlePauseToggle}
                >
                  {activeConversation?.automationPaused ? (
                    <><PlayCircle className="h-3.5 w-3.5" /> Resume Automation</>
                  ) : (
                    <><PauseCircle className="h-3.5 w-3.5" /> Take Over</>
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-slate-700 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10 border-emerald-500/30 text-xs"
                  onClick={handleResolve}
                  disabled={tab === "resolved"}
                >
                  <CheckCheck className="h-3.5 w-3.5" /> Resolve
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {loadingMessages ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
                </div>
              ) : !messages || messages.length === 0 ? (
                <p className="text-center text-sm text-slate-500 py-8">No messages yet</p>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn("flex", msg.direction === "outbound" ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[70%] rounded-2xl px-4 py-2.5 text-sm",
                        msg.direction === "outbound"
                          ? "bg-indigo-600 text-white rounded-br-sm"
                          : "bg-slate-800 text-slate-100 rounded-bl-sm"
                      )}
                    >
                      <p>{msg.text ?? <span className="italic opacity-60">Media message</span>}</p>
                      <p className={cn("text-xs mt-1", msg.direction === "outbound" ? "text-indigo-300" : "text-slate-500")}>
                        {format(parseISO(msg.sentAt), "h:mm a")}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply input */}
            <div className="px-6 py-4 border-t border-slate-800 bg-slate-950">
              <div className="flex gap-3">
                <Input
                  placeholder="Type a reply..."
                  className="bg-slate-900 border-slate-800 flex-1"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                />
                <Button
                  className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
                  onClick={handleSend}
                  disabled={!replyText.trim() || sendReply.isPending}
                >
                  {sendReply.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
