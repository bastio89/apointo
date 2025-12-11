-- Create security definer function to get user's tenant_id without recursion
CREATE OR REPLACE FUNCTION public.get_current_user_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM public.users WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Drop and recreate the users policy using the function
DROP POLICY IF EXISTS "Users can access own tenant users" ON public.users;

CREATE POLICY "Users can access own tenant users" 
ON public.users 
FOR ALL
USING (
  user_id = auth.uid() OR 
  tenant_id = public.get_current_user_tenant_id()
);