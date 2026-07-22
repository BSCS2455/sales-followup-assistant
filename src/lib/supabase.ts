import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type DealStage = "new" | "contacted" | "negotiating" | "won" | "lost";
export type Temperature = "hot" | "warm" | "cold";

export interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  deal_stage: DealStage;
  last_contact_date: string;
  created_at: string;
}

export interface Note {
  id: string;
  lead_id: string;
  raw_text: string;
  created_at: string;
}

export interface AiInsight {
  id: string;
  lead_id: string;
  summary: string;
  temperature: Temperature;
  next_action: string;
  suggested_message: string;
  created_at: string;
}
