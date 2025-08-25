-- Migration: Fix v_active_subscriptions view ordering
-- Date: 2025-08-25 14:00:00
-- Description: Fix the view to prioritize active subscriptions over inactive ones

-- Drop the existing view
DROP VIEW IF EXISTS public.v_active_subscriptions;

-- Recreate the view with correct ordering
CREATE OR REPLACE VIEW public.v_active_subscriptions AS
SELECT DISTINCT ON (user_id)
  s.*,
  public.subscription_is_active(s) AS is_active,
  (CASE WHEN s.end_date IS NOT NULL THEN s.end_date + make_interval(days => greatest(s.grace_days,0)) END) AS grace_until
FROM public.subscriptions s
ORDER BY user_id, 
         CASE WHEN s.status = 'active' THEN 0 ELSE 1 END,
         s.created_at DESC;

-- Grant permissions
GRANT SELECT ON public.v_active_subscriptions TO authenticated;

-- Add comment
COMMENT ON VIEW public.v_active_subscriptions IS 'Active subscriptions per user, prioritizing active status over inactive ones';
