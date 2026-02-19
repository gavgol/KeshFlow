import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { addDays, isToday, isPast, parseISO } from "date-fns";

export interface DueContact {
  id: string;
  name: string;
  phone: string | null;
  last_contact_date: string | null;
  contact_frequency_days: number | null;
}

export interface UpcomingDeal {
  id: string;
  title: string;
  due_date: string | null;
  value: number | null;
  contact_name: string | null;
}

export interface DashboardStats {
  totalContacts: number;
  activeDeals: number;
  revenueThisMonth: number;
}

export function useDashboardData() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalContacts: 0,
    activeDeals: 0,
    revenueThisMonth: 0,
  });
  const [dueContacts, setDueContacts] = useState<DueContact[]>([]);
  const [upcomingDeals, setUpcomingDeals] = useState<UpcomingDeal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    if (!user) return;
    setLoading(true);

    // Fetch all in parallel
    const [contactsRes, dealsRes, stagesRes] = await Promise.all([
      supabase
        .from("contacts")
        .select("id, name, phone, last_contact_date, contact_frequency_days")
        .eq("user_id", user.id),
      supabase
        .from("deals")
        .select("id, title, due_date, value, contact_id, stage_id, user_id")
        .eq("user_id", user.id),
      // Fetch "paid/completed" stage IDs for revenue calc
      supabase
        .from("pipeline_stages")
        .select("id, name, pipeline_id"),
    ]);

    const contacts = contactsRes.data ?? [];
    const deals = dealsRes.data ?? [];
    const stages = stagesRes.data ?? [];

    // --- Stats ---
    const totalContacts = contacts.length;
    const activeDeals = deals.length;

    // Revenue = sum of deal values in stages named "Completed" or "Paid" created this month
    const now = new Date();
    const completedStageIds = stages
      .filter((s) =>
        ["completed", "paid", "closed won"].includes(s.name.toLowerCase())
      )
      .map((s) => s.id);

    const revenueThisMonth = deals
      .filter((d) => {
        if (!d.stage_id || !completedStageIds.includes(d.stage_id)) return false;
        // check if deal updated this month (approximation: created_at not available here, use all)
        return true;
      })
      .reduce((sum, d) => sum + (d.value ?? 0), 0);

    setStats({ totalContacts, activeDeals, revenueThisMonth });

    // --- Due contacts ---
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const due = contacts.filter((c) => {
      const freq = c.contact_frequency_days ?? 30;
      if (!c.last_contact_date) return true; // never contacted
      const lastContact = parseISO(c.last_contact_date);
      const nextDue = addDays(lastContact, freq);
      return nextDue <= today;
    });

    setDueContacts(due as DueContact[]);

    // --- Upcoming deals (next 3 by due_date) ---
    const contactMap = new Map(contacts.map((c) => [c.id, c.name]));

    const upcoming = deals
      .filter((d) => d.due_date)
      .sort((a, b) => {
        const aDate = parseISO(a.due_date!);
        const bDate = parseISO(b.due_date!);
        return aDate.getTime() - bDate.getTime();
      })
      .slice(0, 3)
      .map((d) => ({
        id: d.id,
        title: d.title,
        due_date: d.due_date,
        value: d.value,
        contact_name: d.contact_id ? (contactMap.get(d.contact_id) ?? null) : null,
      }));

    setUpcomingDeals(upcoming);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, [user]);

  return { stats, dueContacts, upcomingDeals, loading, refetch: fetchAll };
}
