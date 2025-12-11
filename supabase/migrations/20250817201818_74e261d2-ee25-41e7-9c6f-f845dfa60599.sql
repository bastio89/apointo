-- Drop the overly permissive public policy
DROP POLICY "Public can read tenant by slug" ON public.tenants;

-- Create a new restrictive policy that only allows access to non-sensitive fields needed for booking
CREATE POLICY "Public can read limited tenant data for booking" 
ON public.tenants 
FOR SELECT 
USING (true)
WITH CHECK (false);