"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase, DealStage } from "@/lib/supabase";

export default function NewLead() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dealStage, setDealStage] = useState<DealStage>("new");
  const [firstNote, setFirstNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    setError(null);

    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .insert({
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        deal_stage: dealStage,
        last_contact_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (leadError || !lead) {
      setError(leadError?.message || "Failed to create lead.");
      setSaving(false);
      return;
    }

    if (firstNote.trim()) {
      await supabase.from("notes").insert({
        lead_id: lead.id,
        raw_text: firstNote.trim(),
      });
    }

    router.push(`/leads/${lead.id}`);
  }

  return (
    <main className="flex-1 w-full max-w-xl mx-auto px-6 py-10">
      <Link href="/" className="text-sm text-[#6B6A63] hover:text-[var(--color-ink)] mb-6 inline-block">
        ← Back to leads
      </Link>
      <h1 className="text-2xl font-bold font-display text-[var(--color-ink)] mb-6">
        Add a new lead
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="block text-sm font-semibold text-[var(--color-ink)] mb-1.5">
            Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Priya Sharma"
            className="w-full rounded-lg border border-[var(--color-line)] px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-[var(--color-ink)] mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="priya@company.com"
              className="w-full rounded-lg border border-[var(--color-line)] px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[var(--color-ink)] mb-1.5">
              Phone
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+92 300 1234567"
              className="w-full rounded-lg border border-[var(--color-line)] px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-[var(--color-ink)] mb-1.5">
            Deal stage
          </label>
          <select
            value={dealStage}
            onChange={(e) => setDealStage(e.target.value as DealStage)}
            className="w-full rounded-lg border border-[var(--color-line)] px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] bg-white"
          >
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="negotiating">Negotiating</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-[var(--color-ink)] mb-1.5">
            First note (optional)
          </label>
          <textarea
            value={firstNote}
            onChange={(e) => setFirstNote(e.target.value)}
            placeholder="What happened on your first call or email with them?"
            rows={4}
            className="w-full rounded-lg border border-[var(--color-line)] px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] resize-none"
          />
        </div>

        {error && <p className="text-sm text-[var(--color-hot)]">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[var(--color-brand)] hover:bg-[var(--color-brand-dark)] text-white text-sm font-semibold px-4 py-3 transition-colors disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save lead"}
        </button>
      </form>
    </main>
  );
}
