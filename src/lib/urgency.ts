import { DealStage } from "./supabase";

// How many days can pass before a lead in each stage is "overdue" for follow-up
const STAGE_THRESHOLDS: Record<DealStage, number> = {
  new: 2,
  contacted: 4,
  negotiating: 2,
  won: 9999,
  lost: 9999,
};

export function daysSince(dateString: string): number {
  const then = new Date(dateString).getTime();
  const now = Date.now();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

export type UrgencyLevel = "overdue" | "due-soon" | "ok" | "closed";

export function getUrgency(
  deal_stage: DealStage,
  last_contact_date: string
): { level: UrgencyLevel; daysSince: number; threshold: number } {
  const threshold = STAGE_THRESHOLDS[deal_stage];
  const days = daysSince(last_contact_date);

  if (deal_stage === "won" || deal_stage === "lost") {
    return { level: "closed", daysSince: days, threshold };
  }

  if (days >= threshold) {
    return { level: "overdue", daysSince: days, threshold };
  }
  if (days >= threshold - 1) {
    return { level: "due-soon", daysSince: days, threshold };
  }
  return { level: "ok", daysSince: days, threshold };
}

// Sort leads: overdue first, then due-soon, then ok, closed last
const LEVEL_ORDER: Record<UrgencyLevel, number> = {
  overdue: 0,
  "due-soon": 1,
  ok: 2,
  closed: 3,
};

export function sortByUrgency<T extends { deal_stage: DealStage; last_contact_date: string }>(
  leads: T[]
): T[] {
  return [...leads].sort((a, b) => {
    const ua = getUrgency(a.deal_stage, a.last_contact_date);
    const ub = getUrgency(b.deal_stage, b.last_contact_date);
    if (LEVEL_ORDER[ua.level] !== LEVEL_ORDER[ub.level]) {
      return LEVEL_ORDER[ua.level] - LEVEL_ORDER[ub.level];
    }
    return ub.daysSince - ua.daysSince; // more overdue first within same level
  });
}
