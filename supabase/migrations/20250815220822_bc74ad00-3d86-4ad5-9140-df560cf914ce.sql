-- Update subscription plans to include appointment limits
UPDATE subscription_plans 
SET features = jsonb_set(features, '{appointments}', '100'::jsonb)
WHERE name = 'Starter';

UPDATE subscription_plans 
SET features = jsonb_set(features, '{appointments}', '500'::jsonb)
WHERE name = 'Pro';

UPDATE subscription_plans 
SET features = jsonb_set(features, '{appointments}', '"unlimited"'::jsonb)
WHERE name = 'Business';