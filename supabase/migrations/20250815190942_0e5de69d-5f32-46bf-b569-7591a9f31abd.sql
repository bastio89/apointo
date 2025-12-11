-- Update subscription plans to match the image pricing
UPDATE public.subscription_plans 
SET 
  name = 'Starter',
  description = 'Perfekt für kleine Salons',
  price_cents = 1900,
  features = '{"staff": 2, "online_bookings": true, "basic_reports": true, "email_support": true}'
WHERE name = 'Basic';

UPDATE public.subscription_plans 
SET 
  name = 'Pro',
  description = 'Für wachsende Salons',
  price_cents = 3900,
  features = '{"staff": 5, "all_starter_features": true, "whatsapp_sms": true, "advanced_reports": true, "priority_support": true}'
WHERE name = 'Premium';

UPDATE public.subscription_plans 
SET 
  name = 'Business',
  description = 'Für große Salon-Ketten',
  price_cents = 7900,
  features = '{"staff": "unlimited", "all_pro_features": true, "multi_location": true, "api_access": true, "dedicated_support": true}'
WHERE name = 'Enterprise';