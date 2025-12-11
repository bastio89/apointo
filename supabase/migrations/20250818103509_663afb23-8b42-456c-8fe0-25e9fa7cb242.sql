-- Update subscription plan prices to new CHF amounts
UPDATE public.subscription_plans 
SET price_cents = 2900, updated_at = now()
WHERE name = 'Starter';

UPDATE public.subscription_plans 
SET price_cents = 4900, updated_at = now()
WHERE name = 'Pro';

UPDATE public.subscription_plans 
SET price_cents = 8900, updated_at = now()
WHERE name = 'Business';