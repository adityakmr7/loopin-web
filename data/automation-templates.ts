export interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  category: "lead_gen" | "engagement" | "support";
  trigger: "comment" | "mention" | "message";
  conditions: {
    text_contains: string[];
  };
  actions: {
    reply?: string;
    like?: boolean;
    hide?: boolean;
    comment_to_dm?: string;
    reply_dm?: string;
  };
}

export const AUTOMATION_TEMPLATES: AutomationTemplate[] = [
  {
    id: "lead-magnet",
    name: "Lead Magnet DM",
    description: "Auto-DM a free guide when someone asks for it in comments",
    category: "lead_gen",
    trigger: "comment",
    conditions: { text_contains: ["freebie", "free guide", "send me"] },
    actions: { comment_to_dm: "Hey {{name}}! Here's your free guide 👉 [link]" },
  },
  {
    id: "giveaway",
    name: "Giveaway Entry",
    description: "Confirm giveaway entries and like the comment automatically",
    category: "engagement",
    trigger: "comment",
    conditions: { text_contains: ["entering", "join", "giveaway"] },
    actions: { reply: "You're entered {{name}} 🎉 Good luck!", like: true },
  },
  {
    id: "product-inquiry",
    name: "Product Inquiry",
    description: "Slide into DMs when someone asks about pricing or buying",
    category: "lead_gen",
    trigger: "comment",
    conditions: { text_contains: ["price", "how much", "buy", "order"] },
    actions: { comment_to_dm: "Hi {{name}}, I'd love to share pricing details with you! 💫" },
  },
  {
    id: "link-delivery",
    name: "Link in Bio Delivery",
    description: "Send the link someone is looking for when mentioned",
    category: "lead_gen",
    trigger: "mention",
    conditions: { text_contains: ["link", "website", "where"] },
    actions: { reply_dm: "Hey {{username}}! Here's the link you asked for 🔗 [url]" },
  },
  {
    id: "dm-keyword",
    name: "DM Keyword Reply",
    description: "Auto-reply when someone DMs a greeting keyword",
    category: "engagement",
    trigger: "message",
    conditions: { text_contains: ["hi", "hello", "hey"] },
    actions: { reply_dm: "Hey {{name}}! Thanks for reaching out 👋 How can I help?" },
  },
  {
    id: "faq-bot",
    name: "FAQ Auto-Reply",
    description: "Answer common hours/availability questions automatically",
    category: "support",
    trigger: "message",
    conditions: { text_contains: ["hours", "open", "available"] },
    actions: {
      reply_dm: "Hi {{name}}! We're open Mon–Fri 9am–6pm. Anything else I can help with?",
    },
  },
];
