-- Update subscription plan prices to new CHF amounts
UPDATE public.subscription_plans 
SET price_cents = 2900
WHERE name = 'Starter';

UPDATE public.subscription_plans 
SET price_cents = 4900
WHERE name = 'Pro';

UPDATE public.subscription_plans 
SET price_cents = 8900
WHERE name = 'Business';