# Followup - the sales ledger that tells you who to call today

### a. What it is, and the problem it solves

FollowUp is a simple web app that helps freelancers and small businesses keep track of their sales leads. <br>
Many people use spreadsheets or try to remember when they last contacted a customer. This often causes them to forget follow-ups and lose potential clients. <br>
This app keeps all lead information in one place, reminds users which leads need attention first, stores conversation notes, and uses AI to suggest the next follow-up message.

### b. Live app

**[[https://sales-followup-assistant.vercel.app](https://sales-followup-assistant.vercel.app/)]** 

### c. Features
-  Add new leads with name, email, phone number, and deal stage
-  View all leads in one dashboard automatically sorted by follow-up priority
-  Mark a lead as contacted today to reset the clock
-  Update the deal stage
-  Add notes after calls, meetings, or emails
-  AI analyzes the notes to suggest the next action
-  Fully responsive layout

### d. The AI feature

When the user clicks Analyze with AI, the app sends the lead's notes and current deal stage to the Groq API.
The AI returns a short summary, recommended next action and follow-up message that the user can send, lead status
- **Hot** =  clear intent to move forward
- **Warm** = interested but not committed yet
- **Cold** = low interest, vague, no sign of moving forward 

AI only uses the information provided in the notes and does not make up details.

**Prompt used:**

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

The full note history for the lead is passed as the user message alongside the lead's name and deal stage, so the model has complete context rather than just the latest note.

### e. Tools, services, and models used
- Next.js
- TypeScript
- Tailwind CSS
- Supabase
- Groq API
- Vercel
- Built with the help of Claude as a coding assistant

### f. Screenshots
 <p align="center">
<img width="767" height="323" alt="image" src="https://github.com/user-attachments/assets/71256f91-9775-440a-9741-0d0a96ab0cf4" />  </p>  
<p align="center">
the main dashboard, leads sorted by urgency
</p>

<p align="center">
   <img width="607" height="579" alt="image" src="https://github.com/user-attachments/assets/9fc89f79-84f5-43de-83b4-87f5d2e058eb" /></p>
<p align="center">
adding a new lead </p>

 <p align="center">   
 <img width="465" height="413" alt="image" src="https://github.com/user-attachments/assets/70cc9f1a-7cae-404f-8573-447599f2a32b" /></p>
<p align="center">
the AI analysis panel <p>

### g. How to run this project locally

**Prerequisites:** Node.js 18+, a [Supabase](https://supabase.com) account, a [Groq](https://console.groq.com) API key.

1. Clone the repo:
2. Install dependencies by **npm install**
3. Create your Supabase project and run this in SQL Editor to create the tables:
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

4. Copy the env example and fill in your real values
5. Run the dev server by **npm run dev**

   Open [http://localhost:3000](http://localhost:3000).


