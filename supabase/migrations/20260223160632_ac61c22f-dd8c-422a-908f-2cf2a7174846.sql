
-- Add custom_fields_schema JSONB to profiles
ALTER TABLE public.profiles
ADD COLUMN custom_fields_schema jsonb DEFAULT '[]'::jsonb;

-- Add custom_data JSONB to deals
ALTER TABLE public.deals
ADD COLUMN custom_data jsonb DEFAULT '{}'::jsonb;
