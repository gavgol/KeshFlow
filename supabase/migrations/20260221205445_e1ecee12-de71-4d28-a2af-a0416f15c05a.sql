-- Add business_logo_url to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_logo_url text;

-- Enable realtime for deals table
ALTER PUBLICATION supabase_realtime ADD TABLE public.deals;