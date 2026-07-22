"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { supabase, Lead, Note, AiInsight, DealStage } from "@/lib/supabase";
import { getUrgency } from "@/lib/urgency";
import { UrgencyTab, TemperatureBadge } from "@/components/UrgencyTab";

const STAGE_LABELS: Record<DealStage, string> = {
  new: "New",
  contacted: "Contacted",
  negotiating: "Negotiating",
  won: "Won",
  lost: "Lost",
};

export default function LeadDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [lead, setLead] = useState<Lead | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [insight, setInsight] = useState<AiInsight | null>(null);
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadAll = useCallback(async () => {
    const [{ data: leadData }, { data: notesData }, { data: insightData }] =
      await Promise.all([
        supabase.from("leads").select("*").eq("id", id).single(),
        supabase
          .from("notes")
          .select("*")
          .eq("lead_id", id)
          .order("created_at", { ascending: false }),
        supabase
          .from("ai_insights")
          .select("*")
          .eq("lead_id", id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

    setLead(leadData as Lead);
    setNotes((notesData as Note[]) || []);
    setInsight((insightData as AiInsight) || null);
  }, [id]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!newNote.trim()) return;
    setSavingNote(true);
    await supabase.from("notes").insert({ lead_id: id, raw_text: newNote.trim() });
    setNewNote("");
    await loadAll();
    setSavingNote(false);
  }

  async function handleMarkContacted() {
    await supabase
      .from("leads")
      .update({ last_contact_date: new Date().toISOString() })
      .eq("id", id);
    await loadAll();
  }

  async function handleStageChange(newStage: DealStage) {
    await supabase.from("leads").update({ deal_stage: newStage }).eq("id", id);
    await loadAll();
  }

  async function handleAnalyze() {
    setAnalyzing(true);
    setAnalyzeError(null);
    try {
      const res = await fetch("/api/analyze-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAnalyzeError(data.error || "Analysis failed.");
      } else {
        setInsight(data.insight);
      }
    } catch {
      setAnalyzeError("Network error. Please try again.");
    }
    setAnalyzing(false);
  }

  function handleCopyMessage() {
    if (!insight) return;
    navigator.clipboard.writeText(insight.suggested_message);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (!lead) {
    return (
      <main className="flex-1 w-full max-w-2xl mx-auto px-6 py-10">
        <p className="text-sm text-[#6B6A63]">Loading…</p>
      </main>
    );
  }

  const urgency = getUrgency(lead.deal_stage, lead.last_contact_date);

  return (
    <main className="flex-1 w-full max-w-2xl mx-auto px-6 py-10">
      <Link href="/" className="text-sm text-[#6B6A63] hover:text-[var(--color-ink)] mb-6 inline-block">
        ← Back to leads
      </Link>

      {/* Lead header */}
      <div className="bg-white border border-[var(--color-line)] rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold font-display text-[var(--color-ink)]">
              {lead.name}
            </h1>
            <p className="text-sm text-[#6B6A63] mt-0.5">
              {lead.email || "No email"} {lead.phone ? `· ${lead.phone}` : ""}
            </p>
          </div>
          <select
            value={lead.deal_stage}
            onChange={(e) => handleStageChange(e.target.value as DealStage)}
            className="rounded-full bg-[#EEEDE8] text-[#4A4940] text-xs font-semibold px-3 py-1.5 border-none focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
          >
            {Object.entries(STAGE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between border-t border-[var(--color-line)] pt-4">
          <UrgencyTab level={urgency.level} days={urgency.daysSince} />
          <button
            onClick={handleMarkContacted}
            className="rounded-lg border border-[var(--color-line)] hover:border-[var(--color-brand)] text-sm font-semibold px-3.5 py-2 transition-colors"
          >
            Mark contacted today
          </button>
        </div>
      </div>

      {/* AI Insight panel */}
      <div className="bg-white border border-[var(--color-line)] rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold font-display text-[var(--color-ink)]">
            AI follow-up analysis
          </h2>
          <button
            onClick={handleAnalyze}
            disabled={analyzing || notes.length === 0}
            className="rounded-lg bg-[var(--color-brand)] hover:bg-[var(--color-brand-dark)] disabled:opacity-50 text-white text-sm font-semibold px-3.5 py-2 transition-colors"
          >
            {analyzing ? "Analyzing…" : insight ? "Re-analyze" : "Analyze with AI"}
          </button>
        </div>

        {notes.length === 0 && (
          <p className="text-sm text-[#6B6A63]">
            Add a note below first — the AI needs something to analyze.
          </p>
        )}

        {analyzeError && (
          <p className="text-sm text-[var(--color-hot)] mb-3">{analyzeError}</p>
        )}

        {insight && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <TemperatureBadge temperature={insight.temperature} />
              <span className="text-xs text-[#8C8A80] font-num">
                analyzed {new Date(insight.created_at).toLocaleString()}
              </span>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#8C8A80] mb-1">
                Summary
              </p>
              <p className="text-sm text-[var(--color-ink)]">{insight.summary}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#8C8A80] mb-1">
                Recommended next action
              </p>
              <p className="text-sm text-[var(--color-ink)]">{insight.next_action}</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#8C8A80]">
                  Drafted follow-up message
                </p>
                <button
                  onClick={handleCopyMessage}
                  className="text-xs font-semibold text-[var(--color-brand)] hover:underline"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <p className="text-sm text-[var(--color-ink)] bg-[#F6F5F2] rounded-lg p-3.5 whitespace-pre-wrap">
                {insight.suggested_message}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="bg-white border border-[var(--color-line)] rounded-xl p-6">
        <h2 className="text-lg font-bold font-display text-[var(--color-ink)] mb-4">
          Notes
        </h2>

        <form onSubmit={handleAddNote} className="flex flex-col gap-2 mb-6">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="What happened on your latest call or email?"
            rows={3}
            className="w-full rounded-lg border border-[var(--color-line)] px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] resize-none"
          />
          <button
            type="submit"
            disabled={savingNote || !newNote.trim()}
            className="self-end rounded-lg bg-[var(--color-ink)] hover:opacity-90 disabled:opacity-50 text-white text-sm font-semibold px-3.5 py-2 transition-opacity"
          >
            {savingNote ? "Adding…" : "Add note"}
          </button>
        </form>

        {notes.length === 0 ? (
          <p className="text-sm text-[#6B6A63]">No notes yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {notes.map((note) => (
              <li key={note.id} className="border-l-2 border-[var(--color-line)] pl-3.5">
                <p className="font-num text-xs text-[#8C8A80] mb-0.5">
                  {new Date(note.created_at).toLocaleString()}
                </p>
                <p className="text-sm text-[var(--color-ink)] whitespace-pre-wrap">
                  {note.raw_text}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
