"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, Lead, DealStage } from "@/lib/supabase";
import { getUrgency, sortByUrgency } from "@/lib/urgency";
import { UrgencyTab } from "@/components/UrgencyTab";

const STAGE_LABELS: Record<DealStage, string> = {
  new: "New",
  contacted: "Contacted",
  negotiating: "Negotiating",
  won: "Won",
  lost: "Lost",
};

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        setError(error.message);
      } else {
        setLeads(data as Lead[]);
      }
    }
    load();
  }, []);

  const sorted = leads ? sortByUrgency(leads) : [];
  const overdueCount = sorted.filter(
    (l) => getUrgency(l.deal_stage, l.last_contact_date).level === "overdue"
  ).length;

  return (
    <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-10">
      <header className="flex items-start justify-between mb-10">
        <div>
          <p className="font-num text-xs tracking-widest text-[#8C8A80] uppercase mb-1">
            Follow-up Ledger
          </p>
          <h1 className="text-3xl font-bold font-display text-[var(--color-ink)]">
            Your leads
          </h1>
          {leads && (
            <p className="text-sm text-[#6B6A63] mt-1">
              {overdueCount > 0
                ? `${overdueCount} lead${overdueCount === 1 ? "" : "s"} overdue for follow-up`
                : "You're all caught up."}
            </p>
          )}
        </div>
        <Link
          href="/leads/new"
          className="shrink-0 rounded-lg bg-[var(--color-brand)] hover:bg-[var(--color-brand-dark)] text-white text-sm font-semibold px-4 py-2.5 transition-colors"
        >
          + New lead
        </Link>
      </header>

      {error && (
        <p className="text-sm text-[var(--color-hot)] mb-6">
          Couldn&apos;t load leads: {error}
        </p>
      )}

      {leads === null && !error && (
        <p className="text-sm text-[#6B6A63]">Loading leads…</p>
      )}

      {leads && leads.length === 0 && (
        <div className="border border-dashed border-[var(--color-line)] rounded-xl p-10 text-center">
          <p className="text-[var(--color-ink)] font-semibold mb-1">
            No leads yet
          </p>
          <p className="text-sm text-[#6B6A63] mb-4">
            Add your first lead to start tracking follow-ups.
          </p>
          <Link
            href="/leads/new"
            className="inline-block rounded-lg bg-[var(--color-brand)] text-white text-sm font-semibold px-4 py-2.5"
          >
            + New lead
          </Link>
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {sorted.map((lead) => {
          const urgency = getUrgency(lead.deal_stage, lead.last_contact_date);
          return (
            <li key={lead.id}>
              <Link
                href={`/leads/${lead.id}`}
                className="flex items-center justify-between gap-4 bg-white border border-[var(--color-line)] rounded-xl px-5 py-4 hover:border-[var(--color-brand)] transition-colors"
              >
                <UrgencyTab level={urgency.level} days={urgency.daysSince} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[var(--color-ink)] truncate">
                    {lead.name}
                  </p>
                  <p className="text-xs text-[#6B6A63]">
                    {lead.email || "No email on file"}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-[#EEEDE8] text-[#4A4940] text-xs font-semibold px-3 py-1">
                  {STAGE_LABELS[lead.deal_stage]}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
