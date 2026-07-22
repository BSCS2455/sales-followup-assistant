# Followup — the sales ledger that tells you who to call today

### a. What it is, and the problem it solves

Small sales teams and solo freelancers juggling more than a handful of leads
almost always fall back on a spreadsheet or memory to track "who did I last
talk to, and what did we say?" Leads go cold not because the deal was bad,
but because nobody followed up in time, or the follow-up message was a
generic "just checking in" that got ignored.

**Followup** is a lightweight lead tracker built for that specific person —
a freelancer, small-business owner, or individual sales rep who doesn't need
(or can't afford) a full CRM like Salesforce or HubSpot, but still needs to:

1. See at a glance which leads are overdue for a follow-up, ranked by urgency
2. Keep a running log of notes from every call/email with a lead
3. Get an AI-generated read on the lead's real interest level and a
   ready-to-send follow-up message drafted from their actual notes —
   instead of manually re-reading old notes and writing from scratch

### b. Live app

**[[https://sales-followup-assistant.vercel.app](https://sales-followup-assistant.vercel.app/)]** 

### c. Features

- Add leads with name, email, phone, and deal stage (New / Contacted / Negotiating / Won / Lost)
- Dashboard automatically sorts leads by follow-up urgency (Overdue → Due soon → On track → Closed), based on deal stage and days since last contact
- Log freeform notes on each lead after every call/email — full history preserved and timestamped
- One-click "Mark contacted today" to reset the follow-up clock
- Change a lead's deal stage inline from the lead's page
- **AI-powered analysis** (see below) — one click summarizes the lead, classifies them hot/warm/cold, recommends a specific next action, and drafts a follow-up message you can copy and send
- Copy-to-clipboard on the drafted message
- Fully responsive layout

### d. The AI feature

**What it does:** On any lead's page, clicking "Analyze with AI" sends that
lead's full note history and deal stage to an LLM, which returns:
- A 1–2 sentence plain-language summary of where the lead actually stands
- A hot / warm / cold classification based on real buying signals in the notes (not just the deal stage)
- A specific, timed recommendation for the next action (not "follow up soon" — actual timing)
- A ready-to-send follow-up message, under 80 words, that references something specific from the notes so it doesn't read like generic sales copy

**Model used:** Llama 3.3 70B via the Groq API (free tier, OpenAI-compatible endpoint).

**Exact system prompt used:**

```
You are a sales follow-up assistant helping a sales representative manage their leads.

You will receive:
- The lead's name
- The lead's current deal stage (new, contacted, negotiating, won, lost)
- Raw notes the rep has written after calls, emails, or meetings with this lead

Your job, using only the information given:
1. Summarize the lead's current status and interest level in 1-2 plain sentences.
2. Classify the lead as "hot", "warm", or "cold" based on urgency and buying signals in the notes (e.g. explicit interest, budget mentioned, timeline mentioned = hot; polite but noncommittal = warm; unresponsive, objections, low interest = cold).
3. Recommend the single best next action and a specific timeframe (e.g. "Follow up in 2 days with pricing details" not just "follow up soon").
4. Draft a short, natural follow-up message (under 80 words) the rep could send right now. It must reference something specific from the notes, sound like a real person wrote it, and must NOT be generic sales fluff or over-promise anything.

If the notes are empty, vague, or contain no useful signal, say so honestly in the summary rather than inventing details.

Respond with ONLY valid JSON, no markdown formatting, no code fences, no extra text before or after. Use exactly this shape:
{
  "summary": "string",
  "temperature": "hot" | "warm" | "cold",
  "next_action": "string",
  "suggested_message": "string"
}
```

The full note history for the lead (all notes, oldest to newest, with dates) is passed as the user message alongside the lead's name and deal stage, so the model has complete context rather than just the latest note.

### e. Tools, services, and models used

- **Framework:** Next.js 15 (App Router, TypeScript, Tailwind CSS)
- **Database:** Supabase (Postgres + auto-generated REST API)
- **AI model:** Llama 3.3 70B, served via Groq's free-tier API
- **Hosting:** Vercel
- **Fonts:** Space Grotesk (display), Inter (body), JetBrains Mono (data/timestamps) via `next/font/google`
- Built with the help of Claude (Anthropic) as a coding assistant

### f. Screenshots

> Replace these placeholders with real screenshots (drag images into this README on GitHub, or reference `/screenshots/*.png` in this repo).

1. `screenshots/dashboard.png` — the main dashboard, leads sorted by urgency
2. `screenshots/add-lead.png` — adding a new lead
3. `screenshots/lead-detail.png` — a lead's page with notes
4. `screenshots/ai-analysis.png` — the AI analysis panel with summary, temperature, and drafted message

### g. How to run this project locally

**Prerequisites:** Node.js 18+, a free [Supabase](https://supabase.com) account, a free [Groq](https://console.groq.com) API key.

1. Clone the repo:
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   cd YOUR_REPO_NAME
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create your Supabase project and run this SQL in the Supabase SQL Editor to create the tables:
   ```sql
   create table leads (
     id uuid primary key default gen_random_uuid(),
     name text not null,
     email text,
     phone text,
     deal_stage text not null default 'new' check (deal_stage in ('new', 'contacted', 'negotiating', 'won', 'lost')),
     last_contact_date timestamp with time zone default now(),
     created_at timestamp with time zone default now()
   );

   create table notes (
     id uuid primary key default gen_random_uuid(),
     lead_id uuid references leads(id) on delete cascade,
     raw_text text not null,
     created_at timestamp with time zone default now()
   );

   create table ai_insights (
     id uuid primary key default gen_random_uuid(),
     lead_id uuid references leads(id) on delete cascade,
     summary text,
     temperature text check (temperature in ('hot', 'warm', 'cold')),
     next_action text,
     suggested_message text,
     created_at timestamp with time zone default now()
   );
   ```

4. Copy the env example and fill in your real values:
   ```bash
   cp .env.local.example .env.local
   ```
   Then edit `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_or_publishable_key
   GROQ_API_KEY=your_groq_api_key
   ```

5. Run the dev server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

### Deploying your own copy

1. Push this repo to your own GitHub account.
2. Go to [vercel.com](https://vercel.com) → New Project → import your GitHub repo.
3. In the Vercel project's Environment Variables settings, add the same three variables from `.env.local`.
4. Deploy. Vercel will give you a live URL automatically.
