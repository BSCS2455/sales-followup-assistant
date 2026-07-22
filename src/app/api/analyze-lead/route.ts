import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const SYSTEM_PROMPT = `You are a sales follow-up assistant helping a sales representative manage their leads.

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
}`;

export async function POST(req: NextRequest) {
  try {
    const { leadId } = await req.json();

    if (!leadId) {
      return NextResponse.json({ error: "leadId is required" }, { status: 400 });
    }

    // Fetch the lead
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("*")
      .eq("id", leadId)
      .single();

    if (leadError || !lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Fetch all notes for this lead, most recent first
    const { data: notes, error: notesError } = await supabase
      .from("notes")
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: true });

    if (notesError) {
      return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
    }

    if (!notes || notes.length === 0) {
      return NextResponse.json(
        { error: "This lead has no notes yet. Add a note first so the AI has something to analyze." },
        { status: 400 }
      );
    }

    const notesText = notes
      .map((n, i) => `Note ${i + 1} (${new Date(n.created_at).toLocaleDateString()}): ${n.raw_text}`)
      .join("\n\n");

    const userMessage = `Lead name: ${lead.name}
Deal stage: ${lead.deal_stage}

Notes history:
${notesText}`;

    // Call Groq (OpenAI-compatible API, free tier)
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        temperature: 0.4,
        response_format: { type: "json_object" },
      }),
    });

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      console.error("Groq API error:", errText);
      return NextResponse.json({ error: "AI service failed. Please try again." }, { status: 502 });
    }

    const groqData = await groqResponse.json();
    const rawContent = groqData.choices?.[0]?.message?.content;

    if (!rawContent) {
      return NextResponse.json({ error: "AI returned an empty response" }, { status: 502 });
    }

    let parsed;
    try {
      const cleaned = rawContent.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", rawContent);
      return NextResponse.json({ error: "AI returned malformed data" }, { status: 502 });
    }

    // Save the insight
    const { data: insight, error: insertError } = await supabase
      .from("ai_insights")
      .insert({
        lead_id: leadId,
        summary: parsed.summary,
        temperature: parsed.temperature,
        next_action: parsed.next_action,
        suggested_message: parsed.suggested_message,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return NextResponse.json({ error: "Failed to save AI insight" }, { status: 500 });
    }

    return NextResponse.json({ insight });
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
