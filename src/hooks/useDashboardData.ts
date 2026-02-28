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
  lastInteractionContent: string | null;
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
  conversionRate: number;
}

export interface RevenueDay {
  day: string;
  revenue: number;
}

export interface RecentActivity {
  id: string;
  type: string;
  content: string | null;
  created_at: string;
  contact_name: string | null;
}

export function useDashboardData() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalContacts: 0,
    activeDeals: 0,
    revenueThisMonth: 0,
    conversionRate: 0,
  });
  const [dueContacts, setDueContacts] = useState<DueContact[]>([]);
  const [upcomingDeals, setUpcomingDeals] = useState<UpcomingDeal[]>([]);
  const [revenueByDay, setRevenueByDay] = useState<RevenueDay[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
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
        .select("id, title, due_date, value, contact_id, stage_id, user_id, updated_at, status")
        .eq("user_id", user.id),
      supabase
        .from("pipeline_stages")
        .select("id, name, pipeline_id"),
    ]);

    const contacts = contactsRes.data ?? [];
    const deals = dealsRes.data ?? [];
    const stages = stagesRes.data ?? [];

    const totalContacts = contacts.length;

    // Use the status column directly
    const activeDeals = deals.filter((d: any) => d.status === 'active').length;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const wonThisMonth = deals.filter((d: any) =>
      d.status === 'won' && d.updated_at >= startOfMonth
    );
    const revenueThisMonth = wonThisMonth.reduce((sum, d) => sum + (d.value ?? 0), 0);

    const wonDeals = deals.filter((d: any) => d.status === 'won');
    const lostDeals = deals.filter((d: any) => d.status === 'lost');
    const totalClosed = wonDeals.length + lostDeals.length;
    const conversionRate = totalClosed > 0 ? Math.round((wonDeals.length / totalClosed) * 100) : 0;

    setStats({ totalContacts, activeDeals, revenueThisMonth, conversionRate });

    // --- Revenue by day (last 7 days from won deals) ---
    const completedDeals = wonDeals;

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

    // --- Fetch interactions once for both lastInteractionMap and recentActivity ---
    const { data: allInteractions } = await supabase
      .from("interactions")
      .select("id, contact_id, type, content, created_at, contacts(name)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    const interactionsList = allInteractions ?? [];

    const lastInteractionMap = new Map<string, string | null>();
    interactionsList.forEach((i: any) => {
      if (!lastInteractionMap.has(i.contact_id) && i.content) {
        lastInteractionMap.set(i.contact_id, i.content);
      }
    });

    // --- Due contacts ---
    today.setHours(0, 0, 0, 0);
    const due = contacts.filter((c) => {
      const freq = c.contact_frequency_days ?? 30;
      if (!c.last_contact_date) return true;
      const lastContact = parseISO(c.last_contact_date);
      const nextDue = addDays(lastContact, freq);
      return nextDue <= today;
    });
    setDueContacts(due.map((c) => ({
      ...c,
      lastInteractionContent: lastInteractionMap.get(c.id) ?? null,
    })) as DueContact[]);

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

    // --- Recent activity (derived from same query) ---
    setRecentActivity(
      interactionsList.slice(0, 8).map((a: any) => ({
        id: a.id,
        type: a.type,
        content: a.content,
        created_at: a.created_at,
        contact_name: a.contacts?.name ?? null,
      }))
    );

    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, [user]);

  return { stats, dueContacts, upcomingDeals, revenueByDay, recentActivity, loading, refetch: fetchAll };
}
