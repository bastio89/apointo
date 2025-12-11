-- Add currency column to settings table
ALTER TABLE public.settings 
ADD COLUMN currency TEXT DEFAULT 'EUR' CHECK (currency IN ('EUR', 'CHF'));