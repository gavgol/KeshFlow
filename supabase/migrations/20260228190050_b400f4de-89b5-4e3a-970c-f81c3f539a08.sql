ALTER TABLE public.deals ADD COLUMN status text NOT NULL DEFAULT 'active';

-- Backfill existing deals: mark deals in "completed/paid/closed won" stages as 'won'
UPDATE public.deals SET status = 'won'
WHERE stage_id IN (
  SELECT id FROM public.pipeline_stages
  WHERE lower(name) IN ('completed', 'paid', 'closed won', 'הושלם', 'שולם')
);

-- Backfill: mark deals in "lost/cancelled" stages as 'lost'
UPDATE public.deals SET status = 'lost'
WHERE stage_id IN (
  SELECT id FROM public.pipeline_stages
  WHERE lower(name) IN ('lost', 'cancelled', 'אבוד', 'בוטל')
);