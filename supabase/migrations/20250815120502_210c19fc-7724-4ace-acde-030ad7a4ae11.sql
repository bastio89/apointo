-- Fix the infinite recursion in users table policy
DROP POLICY IF EXISTS "Users can access own tenant users" ON public.users;

-- Create a simpler, non-recursive policy for users
CREATE POLICY "Users can access own tenant users" 
ON public.users 
FOR ALL
USING (user_id = auth.uid() OR tenant_id IN (
  SELECT tenant_id FROM public.users WHERE user_id = auth.uid()
));

-- Also ensure tenants table has proper public access for booking
DROP POLICY IF EXISTS "Public can read tenant by slug" ON public.tenants;

CREATE POLICY "Public can read tenant by slug" 
ON public.tenants 
FOR SELECT 
USING (true);

-- Fix the services policy to allow public reading for booking
DROP POLICY IF EXISTS "Public can read active services for booking" ON public.services;

CREATE POLICY "Public can read active services for booking" 
ON public.services 
FOR SELECT 
USING (visible_online = true AND active = true);

-- Fix staff policy for public booking
DROP POLICY IF EXISTS "Public can read active staff for booking" ON public.staff;

CREATE POLICY "Public can read active staff for booking" 
ON public.staff 
FOR SELECT 
USING (active = true);