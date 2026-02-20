-- Allow public (anon) access to read business profiles by business_name for the booking page.
-- This is intentionally public since the booking page is meant to be shared publicly.
CREATE POLICY "Public can view business profiles for booking"
  ON public.profiles
  FOR SELECT
  TO anon
  USING (business_name IS NOT NULL AND onboarding_completed = true);

-- Allow anon to insert contacts on behalf of a business owner (for lead capture)
-- The user_id must match an existing profile's user_id (business owner).
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

-- Allow anon to insert deals for the booking pipeline
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

-- Allow anon to read pipeline_stages so we can find the first stage for a business
CREATE POLICY "Public can view pipeline stages for booking"
  ON public.pipeline_stages
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.pipelines pl
      JOIN public.profiles pr ON pr.user_id = pl.user_id
      WHERE pl.id = pipeline_stages.pipeline_id
        AND pr.onboarding_completed = true
        AND pr.business_name IS NOT NULL
    )
  );

-- Allow anon to read pipelines for booking context
CREATE POLICY "Public can view pipelines for booking"
  ON public.pipelines
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles pr
      WHERE pr.user_id = pipelines.user_id
        AND pr.onboarding_completed = true
        AND pr.business_name IS NOT NULL
    )
  );
