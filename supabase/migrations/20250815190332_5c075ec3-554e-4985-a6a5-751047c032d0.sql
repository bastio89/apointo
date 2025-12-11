-- Create subscription plans table
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL,
  interval TEXT NOT NULL, -- 'month' or 'year'
  features JSONB,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create user subscriptions table
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  plan_id UUID REFERENCES public.subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'trial', -- 'trial', 'active', 'expired', 'cancelled'
  trial_start_date TIMESTAMPTZ DEFAULT now(),
  trial_end_date TIMESTAMPTZ DEFAULT (now() + INTERVAL '14 days'),
  subscription_start_date TIMESTAMPTZ,
  subscription_end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id)
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for subscription_plans (public read)
CREATE POLICY "Anyone can read subscription plans" 
ON public.subscription_plans 
FOR SELECT 
USING (active = true);

-- RLS policies for user_subscriptions
CREATE POLICY "Users can read own subscription" 
ON public.user_subscriptions 
FOR SELECT 
USING (tenant_id IN (SELECT users.tenant_id FROM users WHERE users.user_id = auth.uid()));

CREATE POLICY "Users can update own subscription" 
ON public.user_subscriptions 
FOR UPDATE 
USING (tenant_id IN (SELECT users.tenant_id FROM users WHERE users.user_id = auth.uid()));

CREATE POLICY "Users can insert own subscription" 
ON public.user_subscriptions 
FOR INSERT 
WITH CHECK (tenant_id IN (SELECT users.tenant_id FROM users WHERE users.user_id = auth.uid()));

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, description, price_cents, interval, features) VALUES
('Basic', 'Grundausstattung für kleine Salons', 1999, 'month', '{"appointments": 100, "customers": 100, "staff": 2}'),
('Premium', 'Erweiterte Funktionen für wachsende Salons', 3999, 'month', '{"appointments": 500, "customers": 500, "staff": 5, "reports": true}'),
('Enterprise', 'Vollständige Lösung für große Salons', 7999, 'month', '{"appointments": "unlimited", "customers": "unlimited", "staff": "unlimited", "reports": true, "api_access": true}');

-- Function to check subscription status
CREATE OR REPLACE FUNCTION public.get_subscription_status(tenant_uuid UUID)
RETURNS TABLE (
  status TEXT,
  trial_days_left INTEGER,
  plan_name TEXT,
  is_trial_expired BOOLEAN
) 
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    COALESCE(us.status, 'trial') as status,
    CASE 
      WHEN us.trial_end_date > now() THEN EXTRACT(days FROM us.trial_end_date - now())::INTEGER
      ELSE 0
    END as trial_days_left,
    sp.name as plan_name,
    CASE 
      WHEN us.trial_end_date IS NULL THEN false
      WHEN us.trial_end_date <= now() AND us.status = 'trial' THEN true
      ELSE false
    END as is_trial_expired
  FROM public.user_subscriptions us
  LEFT JOIN public.subscription_plans sp ON us.plan_id = sp.id
  WHERE us.tenant_id = tenant_uuid
  UNION ALL
  SELECT 'trial', 14, NULL, false
  WHERE NOT EXISTS (SELECT 1 FROM public.user_subscriptions WHERE tenant_id = tenant_uuid)
  LIMIT 1;
$$;

-- Trigger to create trial subscription when user signs up
CREATE OR REPLACE FUNCTION public.create_trial_subscription()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only create if user has a tenant_id and no subscription exists
  IF NEW.tenant_id IS NOT NULL THEN
    INSERT INTO public.user_subscriptions (
      tenant_id, 
      status, 
      trial_start_date, 
      trial_end_date
    ) VALUES (
      NEW.tenant_id,
      'trial',
      now(),
      now() + INTERVAL '14 days'
    )
    ON CONFLICT (tenant_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new users
CREATE TRIGGER create_trial_subscription_trigger
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_trial_subscription();