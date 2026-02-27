import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { addDays, parseISO, subDays, format } from "date-fns";

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

export interface RevenueDay {
  day: string;
  revenue: number;
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
  const [revenueByDay, setRevenueByDay] = useState<RevenueDay[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    if (!user) return;
    setLoading(true);

    const [contactsRes, dealsRes, stagesRes] = await Promise.all([
      supabase
        .from("contacts")
        .select("id, name, phone, last_contact_date, contact_frequency_days")
        .eq("user_id", user.id),
      supabase
        .from("deals")
        .select("id, title, due_date, value, contact_id, stage_id, user_id, updated_at")
        .eq("user_id", user.id),
      supabase
        .from("pipeline_stages")
        .select("id, name, pipeline_id"),
    ]);

    const contacts = contactsRes.data ?? [];
    const deals = dealsRes.data ?? [];
    const stages = stagesRes.data ?? [];

    const totalContacts = contacts.length;
    const activeDeals = deals.length;

    const completedStageIds = stages
      .filter((s) => {
        const name = s.name.toLowerCase();
        return ["completed", "paid", "closed won", "הושלם"].includes(name);
      })
      .map((s) => s.id);

    const completedDeals = deals.filter(
      (d) => d.stage_id && completedStageIds.includes(d.stage_id)
    );

    const revenueThisMonth = completedDeals.reduce(
      (sum, d) => sum + (d.value ?? 0),
      0
    );

    setStats({ totalContacts, activeDeals, revenueThisMonth });

    // --- Revenue by day (last 7 days from real completed deals) ---
    const today = new Date();
    const days: RevenueDay[] = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(today, 6 - i);
      const dateStr = format(date, "yyyy-MM-dd");
      const dayLabel = format(date, "EEE");
      const dayRevenue = completedDeals
        .filter((d) => {
          const updatedDate = d.updated_at
            ? format(parseISO(d.updated_at), "yyyy-MM-dd")
            : null;
          return updatedDate === dateStr;
        })
        .reduce((sum, d) => sum + (d.value ?? 0), 0);
      return { day: dayLabel, revenue: dayRevenue };
    });
    setRevenueByDay(days);

    // --- Due contacts ---
    today.setHours(0, 0, 0, 0);
    const due = contacts.filter((c) => {
      const freq = c.contact_frequency_days ?? 30;
      if (!c.last_contact_date) return true;
      const lastContact = parseISO(c.last_contact_date);
      const nextDue = addDays(lastContact, freq);
      return nextDue <= today;
    });
    setDueContacts(due as DueContact[]);

    // --- Upcoming deals (next 3 by due_date) ---
    const contactMap = new Map(contacts.map((c) => [c.id, c.name]));
    const upcoming = deals
      .filter((d) => d.due_date)
      .sort((a, b) => parseISO(a.due_date!).getTime() - parseISO(b.due_date!).getTime())
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

  return { stats, dueContacts, upcomingDeals, revenueByDay, loading, refetch: fetchAll };
}
