
-- Fix: the anon insert policies were created as RESTRICTIVE (deny-override) instead of PERMISSIVE (allow).
-- Drop them and recreate as the default PERMISSIVE so anon users can actually insert.

DROP POLICY IF EXISTS "Public can submit leads as contacts" ON public.contacts;
DROP POLICY IF EXISTS "Public can submit lead deals" ON public.deals;

-- PERMISSIVE policy: allow anon to insert a contact as long as the user_id maps to a real business
CREATE POLICY "Public can submit leads as contacts"
  ON public.contacts
  FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = contacts.user_id
        AND p.onboarding_completed = true
        AND p.business_name IS NOT NULL
    )
  );

-- PERMISSIVE policy: allow anon to insert a deal as long as the user_id maps to a real business
CREATE POLICY "Public can submit lead deals"
  ON public.deals
  FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = deals.user_id
        AND p.onboarding_completed = true
        AND p.business_name IS NOT NULL
    )
  );
