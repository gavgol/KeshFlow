import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, parseISO } from "date-fns";

export interface Reminder {
  id: string;
  user_id: string;
  contact_id: string | null;
  deal_id: string | null;
  title: string;
  due_date: string;
  repeat_days: number | null;
  is_done: boolean;
  created_at: string;
  contact_name?: string | null;
  deal_title?: string | null;
}

interface CreateReminderData {
  title: string;
  due_date: string;
  contact_id?: string | null;
  deal_id?: string | null;
  repeat_days?: number | null;
}

export function useReminders() {
  const { user } = useAuth();
  const [allReminders, setAllReminders] = useState<Reminder[]>([]);
  const [completedReminders, setCompletedReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  const mapRow = (r: any): Reminder => ({
    id: r.id,
    user_id: r.user_id,
    contact_id: r.contact_id,
    deal_id: r.deal_id,
    title: r.title,
    due_date: r.due_date,
    repeat_days: r.repeat_days,
    is_done: r.is_done,
    created_at: r.created_at,
    contact_name: r.contacts?.name ?? null,
    deal_title: r.deals?.title ?? null,
  });

  const fetchReminders = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [activeRes, doneRes] = await Promise.all([
      supabase
        .from("reminders")
        .select("*, contacts(name), deals(title)")
        .eq("user_id", user.id)
        .eq("is_done", false)
        .order("due_date", { ascending: true }),
      supabase
        .from("reminders")
        .select("*, contacts(name), deals(title)")
        .eq("user_id", user.id)
        .eq("is_done", true)
        .order("due_date", { ascending: false })
        .limit(10),
    ]);

    if (activeRes.error) {
      console.error("Error fetching reminders:", activeRes.error);
      setAllReminders([]);
    } else {
      setAllReminders((activeRes.data ?? []).map(mapRow));
    }

    setCompletedReminders((doneRes.data ?? []).map(mapRow));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const today = format(new Date(), "yyyy-MM-dd");

  // Reminders due today or past (for dashboard / notifications)
  const reminders = allReminders.filter((r) => r.due_date <= today);

  const overdueCount = reminders.length;

  const createReminder = async (data: CreateReminderData) => {
    if (!user) return;
    const { error } = await supabase.from("reminders").insert({
      user_id: user.id,
      title: data.title,
      due_date: data.due_date,
      contact_id: data.contact_id ?? null,
      deal_id: data.deal_id ?? null,
      repeat_days: data.repeat_days ?? null,
    });
    if (error) {
      console.error("Error creating reminder:", error);
      throw error;
    }
    await fetchReminders();
  };

  const markDone = async (id: string) => {
    if (!user) return;
    const reminder = allReminders.find((r) => r.id === id);
    if (!reminder) return;

    const { error } = await supabase
      .from("reminders")
      .update({ is_done: true })
      .eq("id", id);

    if (error) {
      console.error("Error marking reminder done:", error);
      throw error;
    }

    // If recurring, create next occurrence
    if (reminder.repeat_days) {
      const nextDue = format(addDays(new Date(), reminder.repeat_days), "yyyy-MM-dd");
      await supabase.from("reminders").insert({
        user_id: user.id,
        title: reminder.title,
        due_date: nextDue,
        contact_id: reminder.contact_id,
        deal_id: reminder.deal_id,
        repeat_days: reminder.repeat_days,
      });
    }

    await fetchReminders();
  };

  const deleteReminder = async (id: string) => {
    const { error } = await supabase
      .from("reminders")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting reminder:", error);
      throw error;
    }
    await fetchReminders();
  };

  return {
    reminders,
    allReminders,
    completedReminders,
    overdueCount,
    loading,
    createReminder,
    markDone,
    deleteReminder,
    refetch: fetchReminders,
  };
}
