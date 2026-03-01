"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useContact, useContactInteractions, useUpdateContact, useDeleteContact } from "@/hooks/useContacts";
import { formatDistanceToNow, parseISO, format } from "date-fns";
import { ArrowLeft, Mail, Phone, Tag, Trash2, Loader2, Plus, X, MessageSquare, AtSign, Mail as MailIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";

const INTERACTION_ICONS: Record<string, React.ReactNode> = {
  comment: <MessageSquare className="h-3.5 w-3.5" />,
  mention: <AtSign className="h-3.5 w-3.5" />,
  dm: <MailIcon className="h-3.5 w-3.5" />,
};

const INTERACTION_COLORS: Record<string, string> = {
  comment: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  mention: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  dm: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contactId = params.id as string;

  const { data: contact, isLoading } = useContact(contactId);
  const { data: interactions } = useContactInteractions(contactId);
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();

  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [tagInput, setTagInput] = useState("");
  const [initialized, setInitialized] = useState(false);

  // Sync form once contact loads
  if (contact && !initialized) {
    setEmail(contact.email ?? "");
    setPhone(contact.phone ?? "");
    setNotes(contact.notes ?? "");
    setInitialized(true);
  }

  const handleSave = async () => {
    if (!contact) return;
    try {
      await updateContact.mutateAsync({
        id: contact.id,
        patch: { email: email || null, phone: phone || null, notes: notes || null },
      });
      toast.success("Contact saved");
    } catch {
      toast.error("Failed to save contact");
    }
  };

  const addTag = async (tag: string) => {
    if (!contact || !tag.trim()) return;
    const newTags = [...contact.tags, tag.trim()];
    try {
      await updateContact.mutateAsync({ id: contact.id, patch: { tags: newTags } });
      setTagInput("");
    } catch {
      toast.error("Failed to add tag");
    }
  };

  const removeTag = async (tag: string) => {
    if (!contact) return;
    const newTags = contact.tags.filter((t) => t !== tag);
    try {
      await updateContact.mutateAsync({ id: contact.id, patch: { tags: newTags } });
    } catch {
      toast.error("Failed to remove tag");
    }
  };

  const handleDelete = async () => {
    if (!contact) return;
    try {
      await deleteContact.mutateAsync(contact.id);
      toast.success("Contact deleted");
      router.push("/contacts");
    } catch {
      toast.error("Failed to delete contact");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="text-center py-16 text-slate-400">
        <p>Contact not found</p>
        <Link href="/contacts" className="text-indigo-400 hover:underline mt-2 inline-block">Back to contacts</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Link href="/contacts" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-300 mb-4 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Contacts
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {contact.profilePictureUrl ? (
              <img src={contact.profilePictureUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <div className="h-16 w-16 rounded-full bg-slate-700 flex items-center justify-center text-xl text-slate-300">
                {contact.username[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{contact.displayName ?? `@${contact.username}`}</h1>
              {contact.displayName && <p className="text-slate-400">@{contact.username}</p>}
              <p className="text-xs text-slate-500 mt-1">
                First seen {formatDistanceToNow(parseISO(contact.firstSeenAt), { addSuffix: true })} · {contact.interactionCount} interaction{contact.interactionCount !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
            onClick={handleDelete}
            disabled={deleteContact.isPending}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tags */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
            <Tag className="h-4 w-4" /> Tags
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {contact.tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-700 text-slate-300 text-sm">
                {tag}
                <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-400 transition-colors">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {contact.tags.length === 0 && <span className="text-sm text-slate-500 italic">No tags yet</span>}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Add tag..."
              className="bg-slate-950 border-slate-800 h-8 text-sm"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(tagInput); } }}
            />
            <Button size="sm" variant="secondary" onClick={() => addTag(tagInput)} disabled={!tagInput.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contact details */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-slate-400">Contact Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-slate-400"><Mail className="h-3.5 w-3.5" /> Email</Label>
            <Input
              placeholder="contact@email.com"
              className="bg-slate-950 border-slate-800"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-slate-400"><Phone className="h-3.5 w-3.5" /> Phone</Label>
            <Input
              placeholder="+1 555 000 0000"
              className="bg-slate-950 border-slate-800"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-slate-400">Notes</Label>
            <textarea
              placeholder="Internal notes about this contact..."
              className="w-full min-h-[80px] rounded-md bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <Button
            className="bg-indigo-600 hover:bg-indigo-700 text-white w-full"
            onClick={handleSave}
            disabled={updateContact.isPending}
          >
            {updateContact.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* Interaction timeline */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-slate-400">Interaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {!interactions || interactions.length === 0 ? (
            <p className="text-sm text-slate-500 italic">No interactions recorded yet</p>
          ) : (
            <div className="space-y-3">
              {interactions.map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border shrink-0 mt-0.5", INTERACTION_COLORS[item.type])}>
                    {INTERACTION_ICONS[item.type]}
                    {item.type}
                  </span>
                  <div className="min-w-0">
                    {item.text && (
                      <p className="text-sm text-slate-300 truncate">{item.text}</p>
                    )}
                    <p className="text-xs text-slate-500">
                      {format(parseISO(item.occurredAt), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
