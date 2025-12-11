-- Create custom types
CREATE TYPE role AS ENUM ('OWNER', 'STYLIST', 'RECEPTION');
CREATE TYPE appointment_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');
CREATE TYPE channel AS ENUM ('ONLINE', 'PHONE', 'WALKIN', 'WHATSAPP');

-- Create tenants table
CREATE TABLE public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    locale TEXT DEFAULT 'de-DE',
    logo_url TEXT,
    domain TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create users table (extends auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    role role NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create staff table
CREATE TABLE public.staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    color_hex TEXT,
    skills TEXT[],
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create services table
CREATE TABLE public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    duration_min INTEGER NOT NULL,
    price_cents INTEGER NOT NULL,
    visible_online BOOLEAN DEFAULT true,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create staff_services junction table
CREATE TABLE public.staff_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE,
    service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
    UNIQUE(staff_id, service_id)
);

-- Create time_blocks table
CREATE TABLE public.time_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE,
    weekday INTEGER, -- 0=Sun ... 6=Sat
    date DATE,
    start_min INTEGER NOT NULL,
    end_min INTEGER NOT NULL,
    type TEXT NOT NULL, -- 'OPEN' | 'BREAK' | 'OFF'
    note TEXT
);

-- Create customers table
CREATE TABLE public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    notes TEXT,
    tags TEXT[],
    consent_flags JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create appointments table
CREATE TABLE public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE RESTRICT,
    staff_id UUID REFERENCES public.staff(id) ON DELETE RESTRICT,
    service_id UUID REFERENCES public.services(id) ON DELETE RESTRICT,
    source channel DEFAULT 'ONLINE',
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    status appointment_status DEFAULT 'PENDING',
    deposit_cents INTEGER,
    deposit_paid_at TIMESTAMPTZ,
    cancellation_at TIMESTAMPTZ,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create reminders table
CREATE TABLE public.reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
    channel TEXT NOT NULL, -- 'EMAIL' | 'SMS' | 'WHATSAPP'
    scheduled_at TIMESTAMPTZ NOT NULL,
    sent_at TIMESTAMPTZ,
    payload JSONB
);

-- Create invoices table
CREATE TABLE public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES public.appointments(id),
    number TEXT UNIQUE NOT NULL,
    items JSONB NOT NULL,
    total_cents INTEGER NOT NULL,
    vat_rate REAL,
    pdf_url TEXT,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create settings table
CREATE TABLE public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID UNIQUE REFERENCES public.tenants(id) ON DELETE CASCADE,
    booking_interval_min INTEGER DEFAULT 15,
    require_deposit BOOLEAN DEFAULT false,
    deposit_cents INTEGER,
    cancellation_hours INTEGER DEFAULT 24,
    enable_whatsapp BOOLEAN DEFAULT false,
    sender_email TEXT,
    sender_name TEXT,
    timezone TEXT DEFAULT 'Europe/Zurich'
);

-- Create opening_hours table
CREATE TABLE public.opening_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID UNIQUE REFERENCES public.tenants(id) ON DELETE CASCADE,
    mon_start INTEGER,
    mon_end INTEGER,
    tue_start INTEGER,
    tue_end INTEGER,
    wed_start INTEGER,
    wed_end INTEGER,
    thu_start INTEGER,
    thu_end INTEGER,
    fri_start INTEGER,
    fri_end INTEGER,
    sat_start INTEGER,
    sat_end INTEGER,
    sun_start INTEGER,
    sun_end INTEGER
);

-- Create audit_logs table
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID,
    type TEXT NOT NULL,
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_users_tenant_id ON public.users(tenant_id);
CREATE INDEX idx_staff_tenant_id ON public.staff(tenant_id);
CREATE INDEX idx_services_tenant_id ON public.services(tenant_id);
CREATE INDEX idx_customers_tenant_id ON public.customers(tenant_id);
CREATE INDEX idx_appointments_tenant_staff_start ON public.appointments(tenant_id, staff_id, start_at);
CREATE INDEX idx_appointments_tenant_customer ON public.appointments(tenant_id, customer_id);
CREATE INDEX idx_reminders_scheduled_at ON public.reminders(scheduled_at);
CREATE INDEX idx_time_blocks_tenant_staff ON public.time_blocks(tenant_id, staff_id);

-- Enable RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opening_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for multi-tenancy
-- Users can access their own tenant's data
CREATE POLICY "Users can access own tenant data" ON public.tenants
FOR ALL USING (id IN (
    SELECT tenant_id FROM public.users WHERE user_id = auth.uid()
));

CREATE POLICY "Users can access own tenant users" ON public.users
FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM public.users WHERE user_id = auth.uid()
));

CREATE POLICY "Users can access own tenant staff" ON public.staff
FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM public.users WHERE user_id = auth.uid()
));

CREATE POLICY "Users can access own tenant services" ON public.services
FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM public.users WHERE user_id = auth.uid()
));

CREATE POLICY "Users can access own tenant staff_services" ON public.staff_services
FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM public.users WHERE user_id = auth.uid()
));

CREATE POLICY "Users can access own tenant time_blocks" ON public.time_blocks
FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM public.users WHERE user_id = auth.uid()
));

CREATE POLICY "Users can access own tenant customers" ON public.customers
FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM public.users WHERE user_id = auth.uid()
));

CREATE POLICY "Users can access own tenant appointments" ON public.appointments
FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM public.users WHERE user_id = auth.uid()
));

CREATE POLICY "Users can access own tenant reminders" ON public.reminders
FOR ALL USING (appointment_id IN (
    SELECT id FROM public.appointments WHERE tenant_id IN (
        SELECT tenant_id FROM public.users WHERE user_id = auth.uid()
    )
));

CREATE POLICY "Users can access own tenant invoices" ON public.invoices
FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM public.users WHERE user_id = auth.uid()
));

CREATE POLICY "Users can access own tenant settings" ON public.settings
FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM public.users WHERE user_id = auth.uid()
));

CREATE POLICY "Users can access own tenant opening_hours" ON public.opening_hours
FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM public.users WHERE user_id = auth.uid()
));

CREATE POLICY "Users can access own tenant audit_logs" ON public.audit_logs
FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM public.users WHERE user_id = auth.uid()
));

-- Public access for booking pages (by tenant slug)
CREATE POLICY "Public can read tenant by slug" ON public.tenants
FOR SELECT USING (true);

CREATE POLICY "Public can read active services for booking" ON public.services
FOR SELECT USING (visible_online = true AND active = true);

CREATE POLICY "Public can read active staff for booking" ON public.staff
FOR SELECT USING (active = true);

CREATE POLICY "Public can read staff_services for booking" ON public.staff_services
FOR SELECT USING (true);

CREATE POLICY "Public can read opening_hours for booking" ON public.opening_hours
FOR SELECT USING (true);

CREATE POLICY "Public can read settings for booking" ON public.settings
FOR SELECT USING (true);

-- Allow public booking creation
CREATE POLICY "Public can create appointments" ON public.appointments
FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can create customers" ON public.customers
FOR INSERT WITH CHECK (true);