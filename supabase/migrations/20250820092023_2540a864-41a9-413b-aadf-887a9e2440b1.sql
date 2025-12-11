-- Ensure user_subscriptions are properly created for all users with trial dates
-- Update the function to handle trial countdown correctly
CREATE OR REPLACE FUNCTION public.get_subscription_status(tenant_uuid uuid)
RETURNS TABLE(status text, trial_days_left integer, plan_name text, is_trial_expired boolean)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    COALESCE(us.status, 'trial') as status,
    CASE 
      WHEN us.trial_end_date IS NULL THEN 14
      WHEN us.trial_end_date > now() THEN GREATEST(0, EXTRACT(days FROM (us.trial_end_date - now()))::INTEGER)
      ELSE 0
    END as trial_days_left,
    sp.name as plan_name,
    CASE 
      WHEN us.trial_end_date IS NULL THEN false
      WHEN us.trial_end_date <= now() AND COALESCE(us.status, 'trial') = 'trial' THEN true
      ELSE false
    END as is_trial_expired
  FROM public.user_subscriptions us
  LEFT JOIN public.subscription_plans sp ON us.plan_id = sp.id
  WHERE us.tenant_id = tenant_uuid
  UNION ALL
  SELECT 'trial', 14, NULL, false
  WHERE NOT EXISTS (SELECT 1 FROM public.user_subscriptions WHERE tenant_id = tenant_uuid)
  LIMIT 1;
$function$;