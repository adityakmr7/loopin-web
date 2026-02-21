"use client";

import { useState, useEffect, KeyboardEvent } from "react";
import { toast } from "sonner";
import { formatDistanceToNow, format, parseISO } from "date-fns";
import {
  Shield,
  Bell,
  Monitor,
  X,
  Loader2,
  LogOut,
  Trash2,
  Globe,
  Clock,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useSettings, useUpdateSettings, type UserSettings } from "@/hooks/useSettings";
import { useSessions, useRevokeSession, useLogoutAllSessions } from "@/hooks/useSessions";

// ─── Constants ────────────────────────────────────────────────────────────────

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Africa/Nairobi",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
];

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-md bg-slate-800 ${className}`} />
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="bg-slate-900 border-slate-800">
          <CardHeader>
            <SkeletonBlock className="h-5 w-40" />
            <SkeletonBlock className="h-3 w-64 mt-1" />
          </CardHeader>
          <CardContent className="space-y-4">
            <SkeletonBlock className="h-10 w-full" />
            <SkeletonBlock className="h-10 w-full" />
            <SkeletonBlock className="h-10 w-3/4" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Tag chip input ────────────────────────────────────────────────────────────

function TagInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
}) {
  const [inputVal, setInputVal] = useState("");

  const add = () => {
    const trimmed = inputVal.trim().toLowerCase();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInputVal("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      add();
    }
    if (e.key === "Backspace" && !inputVal && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 min-h-[42px] flex flex-wrap gap-1.5 focus-within:border-indigo-500 transition-colors">
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-md bg-indigo-600/20 border border-indigo-500/30 px-2 py-0.5 text-xs font-medium text-indigo-300"
        >
          {tag}
          <button
            type="button"
            onClick={() => onChange(value.filter((t) => t !== tag))}
            className="text-indigo-400 hover:text-red-400 transition-colors"
            aria-label={`Remove ${tag}`}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        className="flex-1 min-w-[140px] bg-transparent outline-none text-sm text-slate-200 placeholder:text-slate-500"
        value={inputVal}
        onChange={(e) => setInputVal(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={add}
        placeholder={value.length === 0 ? placeholder : "Add another…"}
      />
    </div>
  );
}

// ─── Section wrapper ───────────────────────────────────────────────────────────

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-600/10">
            <Icon className="h-4 w-4 text-indigo-400" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
            <CardDescription className="text-slate-500 text-xs mt-0.5">
              {description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <Separator className="bg-slate-800" />
      <CardContent className="pt-5">{children}</CardContent>
    </Card>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const { mutateAsync: updateSettings } = useUpdateSettings();

  // Section 1 local state — Automation Safety
  const [maxReplies, setMaxReplies] = useState<number>(30);
  const [delayMin, setDelayMin] = useState<number>(5);
  const [delayMax, setDelayMax] = useState<number>(30);
  const [blockedKeywords, setBlockedKeywords] = useState<string[]>([]);
  const [ignoredUsernames, setIgnoredUsernames] = useState<string[]>([]);
  const [savingAutomation, setSavingAutomation] = useState(false);

  // Section 2 local state — Preferences
  const [timezone, setTimezone] = useState("UTC");
  const [notifyExpiry, setNotifyExpiry] = useState(true);
  const [notifyFailure, setNotifyFailure] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Sync local state once settings load
  useEffect(() => {
    if (!settings) return;
    setMaxReplies(settings.maxRepliesPerHour);
    setDelayMin(settings.replyDelayMinSecs);
    setDelayMax(settings.replyDelayMaxSecs);
    setBlockedKeywords(settings.blockedKeywords);
    setIgnoredUsernames(settings.ignoredUsernames);
    setTimezone(settings.timezone);
    setNotifyExpiry(settings.notifyOnTokenExpiry);
    setNotifyFailure(settings.notifyOnRuleFailure);
  }, [settings]);

  // Delay validation
  const delayError = delayMin > delayMax;

  // ── Save automation settings ──────────────────────────────────────────────
  const saveAutomation = async () => {
    if (delayError) return;
    setSavingAutomation(true);
    try {
      await updateSettings({
        maxRepliesPerHour: maxReplies,
        replyDelayMinSecs: delayMin,
        replyDelayMaxSecs: delayMax,
        blockedKeywords,
        ignoredUsernames,
      } satisfies Partial<UserSettings>);
      toast.success("Automation settings saved");
    } catch {
      toast.error("Failed to save automation settings");
    } finally {
      setSavingAutomation(false);
    }
  };

  // ── Save preferences ──────────────────────────────────────────────────────
  const savePreferences = async () => {
    setSavingPrefs(true);
    try {
      await updateSettings({ timezone } satisfies Partial<UserSettings>);
      toast.success("Preferences saved");
    } catch {
      toast.error("Failed to save preferences");
    } finally {
      setSavingPrefs(false);
    }
  };

  // ── Toggle helpers (instant save) ────────────────────────────────────────
  const handleToggle = async (
    field: "notifyOnTokenExpiry" | "notifyOnRuleFailure",
    value: boolean
  ) => {
    if (field === "notifyOnTokenExpiry") setNotifyExpiry(value);
    else setNotifyFailure(value);
    try {
      await updateSettings({ [field]: value });
      toast.success("Preference updated");
    } catch {
      // revert on failure
      if (field === "notifyOnTokenExpiry") setNotifyExpiry(!value);
      else setNotifyFailure(!value);
      toast.error("Failed to update preference");
    }
  };

  // ── Sessions ──────────────────────────────────────────────────────────────
  const { data: sessions, isLoading: loadingSessions } = useSessions();
  const { mutate: revokeSession, isPending: revoking } = useRevokeSession();
  const { mutate: logoutAll, isPending: loggingOutAll } = useLogoutAllSessions();
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const handleRevoke = (id: string) => {
    setRevokingId(id);
    revokeSession(id, {
      onSuccess: () => {
        toast.success("Session revoked");
        setRevokingId(null);
      },
      onError: () => {
        toast.error("Failed to revoke session");
        setRevokingId(null);
      },
    });
  };

  const handleLogoutAll = () => {
    logoutAll(undefined, {
      onError: () => toast.error("Failed to logout all devices"),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-slate-400">Manage your Loopin preferences</p>
        </div>
        <SettingsSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-slate-400">Manage your Loopin preferences</p>
      </div>

      {/* ── Section 1: Automation Safety ───────────────────────────────────── */}
      <SectionCard
        icon={Shield}
        title="Automation Safety"
        description="Control rate limits and filtering to keep your account safe."
      >
        <div className="space-y-6">
          {/* Max replies per hour */}
          <div className="space-y-1.5">
            <Label htmlFor="maxReplies" className="text-slate-200">
              Max replies per hour
            </Label>
            <p className="text-xs text-slate-500">
              Upper bound on automated replies sent in a 60-minute window (1–500).
            </p>
            <Input
              id="maxReplies"
              type="number"
              min={1}
              max={500}
              value={maxReplies}
              onChange={(e) => setMaxReplies(Number(e.target.value))}
              className="w-40 bg-slate-950 border-slate-700 text-slate-100 focus:border-indigo-500"
            />
          </div>

          {/* Reply delay range */}
          <div className="space-y-1.5">
            <Label className="text-slate-200">Reply delay range (seconds)</Label>
            <p className="text-xs text-slate-500">
              Delay each reply by a random duration within this range (0–300s).
            </p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 w-6">Min</span>
                <Input
                  type="number"
                  min={0}
                  max={300}
                  value={delayMin}
                  onChange={(e) => setDelayMin(Number(e.target.value))}
                  className={`w-24 bg-slate-950 border-slate-700 text-slate-100 focus:border-indigo-500 ${delayError ? "border-red-500 focus:border-red-500" : ""}`}
                />
              </div>
              <span className="text-slate-600">→</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 w-6">Max</span>
                <Input
                  type="number"
                  min={0}
                  max={300}
                  value={delayMax}
                  onChange={(e) => setDelayMax(Number(e.target.value))}
                  className={`w-24 bg-slate-950 border-slate-700 text-slate-100 focus:border-indigo-500 ${delayError ? "border-red-500 focus:border-red-500" : ""}`}
                />
              </div>
            </div>
            {delayError && (
              <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                <span>⚠</span> Min delay cannot exceed max delay.
              </p>
            )}
          </div>

          {/* Blocked keywords */}
          <div className="space-y-1.5">
            <Label className="text-slate-200">Blocked keywords</Label>
            <p className="text-xs text-slate-500">
              Replies containing these words are skipped. Press{" "}
              <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono">
                Enter
              </kbd>{" "}
              to add.
            </p>
            <TagInput
              value={blockedKeywords}
              onChange={setBlockedKeywords}
              placeholder="e.g. spam, giveaway…"
            />
          </div>

          {/* Ignored usernames */}
          <div className="space-y-1.5">
            <Label className="text-slate-200">Ignored usernames</Label>
            <p className="text-xs text-slate-500">
              Messages or comments from these accounts are completely ignored. Press{" "}
              <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono">
                Enter
              </kbd>{" "}
              to add.
            </p>
            <TagInput
              value={ignoredUsernames}
              onChange={setIgnoredUsernames}
              placeholder="e.g. competitor_account…"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={saveAutomation}
              disabled={delayError || savingAutomation}
              className="bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
            >
              {savingAutomation && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </div>
      </SectionCard>

      {/* ── Section 2: Preferences ─────────────────────────────────────────── */}
      <SectionCard
        icon={Bell}
        title="Preferences"
        description="Timezone and notification preferences."
      >
        <div className="space-y-6">
          {/* Timezone */}
          <div className="space-y-1.5">
            <Label className="text-slate-200 flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-slate-400" />
              Timezone
            </Label>
            <p className="text-xs text-slate-500">
              Used to display timestamps in your local time.
            </p>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger className="w-64 bg-slate-950 border-slate-700 text-slate-100 focus:ring-indigo-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 text-slate-100">
                {TIMEZONES.map((tz) => (
                  <SelectItem
                    key={tz}
                    value={tz}
                    className="focus:bg-slate-800 focus:text-slate-100"
                  >
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notification toggles */}
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-200">
                  Notify me when my Instagram token is about to expire
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  We'll alert you before your auth token expires so automation keeps running.
                </p>
              </div>
              <Switch
                checked={notifyExpiry}
                onCheckedChange={(v) => handleToggle("notifyOnTokenExpiry", v)}
                className="data-[state=checked]:bg-indigo-600 ml-4 shrink-0"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-200">
                  Notify me when an automation rule fails
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Get notified if a rule encounters an error during execution.
                </p>
              </div>
              <Switch
                checked={notifyFailure}
                onCheckedChange={(v) => handleToggle("notifyOnRuleFailure", v)}
                className="data-[state=checked]:bg-indigo-600 ml-4 shrink-0"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={savePreferences}
              disabled={savingPrefs}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {savingPrefs && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </div>
      </SectionCard>

      {/* ── Section 3: Active Sessions ─────────────────────────────────────── */}
      <SectionCard
        icon={Monitor}
        title="Active Sessions"
        description="All devices currently logged into your Loopin account."
      >
        <div className="space-y-4">
          {loadingSessions ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <SkeletonBlock key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !sessions?.length ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-500">
              <Monitor className="h-8 w-8 mb-3 opacity-20" />
              <p className="text-sm">No active sessions found.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => {
                const isExpired = new Date(session.expiresAt) < new Date();
                return (
                  <div
                    key={session.id}
                    className="flex items-center justify-between gap-4 rounded-lg border border-slate-800 bg-slate-950 px-4 py-3"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-0.5 p-1.5 rounded-md bg-slate-800 shrink-0">
                        <Monitor className="h-3.5 w-3.5 text-slate-400" />
                      </div>
                      <div className="min-w-0">
                        {session.userAgent && (
                          <p className="text-sm text-slate-300 font-medium truncate max-w-sm">
                            {session.userAgent}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Created{" "}
                            {formatDistanceToNow(parseISO(session.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                          <span>·</span>
                          <span>
                            Expires{" "}
                            {isExpired
                              ? "expired"
                              : format(parseISO(session.expiresAt), "MMM d, yyyy")}
                          </span>
                          {isExpired && (
                            <Badge
                              variant="outline"
                              className="border-red-800 text-red-400 text-[10px] py-0"
                            >
                              Expired
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevoke(session.id)}
                      disabled={revokingId === session.id}
                      className="text-slate-400 hover:text-red-400 hover:bg-red-400/10 shrink-0"
                    >
                      {revokingId === session.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                          Revoke
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          <Separator className="bg-slate-800 my-4" />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-200">Logout all devices</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Revokes all refresh tokens and signs you out everywhere.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleLogoutAll}
              disabled={loggingOutAll}
              className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-600/30 hover:border-red-600 transition-all shrink-0"
            >
              {loggingOutAll ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <LogOut className="h-3.5 w-3.5 mr-1.5" />
              )}
              Logout all devices
            </Button>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
