import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  business_name: string | null;
  business_type: string | null;
  business_logo_url: string | null;
  custom_fields_schema: any[] | null;
  locale: string;
  onboarding_completed: boolean;
  default_view: string | null;
}

export function useProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading: loading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (error) throw error;
      return data as Profile;
    },
    enabled: !!user,
  });

  const refetch = () => queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });

  return { profile: profile ?? null, loading: !user ? false : loading, refetch };
}
