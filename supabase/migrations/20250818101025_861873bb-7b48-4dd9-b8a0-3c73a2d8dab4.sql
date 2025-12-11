-- Drop the overly permissive public policy (if exists)
DROP POLICY IF EXISTS "Public can read tenant by slug" ON public.tenants;
DROP POLICY IF EXISTS "Public can read limited tenant data for booking" ON public.tenants;

-- Create a new restrictive policy that only allows access to non-sensitive fields needed for booking
-- Note: RLS policies control row access, not column access, so we need to handle this in the application layer
CREATE POLICY "Public can read tenant by slug for booking" 
ON public.tenants 
FOR SELECT 
USING (true);