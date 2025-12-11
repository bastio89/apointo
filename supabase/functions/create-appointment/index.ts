import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateAppointmentRequest {
  tenantSlug: string;
  serviceId: string;
  staffId?: string;
  startAt: string;
  customer: {
    name: string;
    email: string;
    phone?: string;
    notes?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tenantSlug, serviceId, staffId, startAt, customer }: CreateAppointmentRequest = await req.json();

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get tenant by slug
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("id")
      .eq("slug", tenantSlug)
      .single();

    if (tenantError || !tenant) {
      return new Response(
        JSON.stringify({ error: "Salon nicht gefunden" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get service details
    const { data: service, error: serviceError } = await supabase
      .from("services")
      .select("duration_min")
      .eq("id", serviceId)
      .eq("tenant_id", tenant.id)
      .single();

    if (serviceError || !service) {
      return new Response(
        JSON.stringify({ error: "Service nicht gefunden" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Calculate end time
    const startDate = new Date(startAt);
    const endDate = new Date(startDate.getTime() + service.duration_min * 60000);

    // Create or get customer
    let customerId: string;
    
    // Check if customer exists
    const { data: existingCustomer, error: customerSearchError } = await supabase
      .from("customers")
      .select("id")
      .eq("tenant_id", tenant.id)
      .eq("email", customer.email)
      .single();

    if (existingCustomer) {
      customerId = existingCustomer.id;
      
      // Update customer info
      const { error: updateError } = await supabase
        .from("customers")
        .update({
          name: customer.name,
          phone: customer.phone,
          notes: customer.notes,
        })
        .eq("id", customerId);

      if (updateError) {
        console.error("Error updating customer:", updateError);
      }
    } else {
      // Create new customer
      const { data: newCustomer, error: createCustomerError } = await supabase
        .from("customers")
        .insert({
          tenant_id: tenant.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          notes: customer.notes,
        })
        .select("id")
        .single();

      if (createCustomerError || !newCustomer) {
        throw new Error("Failed to create customer");
      }

      customerId = newCustomer.id;
    }

    // Auto-assign staff if not specified
    let finalStaffId = staffId;
    if (!finalStaffId) {
      const { data: availableStaff, error: staffError } = await supabase
        .from("staff_services")
        .select("staff_id")
        .eq("tenant_id", tenant.id)
        .eq("service_id", serviceId)
        .limit(1);

      if (staffError || !availableStaff || availableStaff.length === 0) {
        return new Response(
          JSON.stringify({ error: "Kein verfügbares Personal gefunden" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      finalStaffId = availableStaff[0].staff_id;
    }

    // Check for conflicts (simplified - in production would be more complex)
    const { data: conflicts, error: conflictError } = await supabase
      .from("appointments")
      .select("id")
      .eq("tenant_id", tenant.id)
      .eq("staff_id", finalStaffId)
      .gte("start_at", startDate.toISOString())
      .lt("start_at", endDate.toISOString())
      .neq("status", "CANCELLED");

    if (conflictError) {
      throw conflictError;
    }

    if (conflicts && conflicts.length > 0) {
      return new Response(
        JSON.stringify({ error: "Dieser Zeitslot ist bereits belegt" }),
        {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create appointment
    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .insert({
        tenant_id: tenant.id,
        customer_id: customerId,
        staff_id: finalStaffId,
        service_id: serviceId,
        start_at: startDate.toISOString(),
        end_at: endDate.toISOString(),
        source: "ONLINE",
        status: "PENDING",
        note: customer.notes,
      })
      .select(`
        id,
        start_at,
        end_at,
        status,
        service:services(name, price_cents),
        staff:staff(name),
        customer:customers(name, email)
      `)
      .single();

    if (appointmentError) {
      throw appointmentError;
    }

    // Create reminder (24h before)
    const reminderTime = new Date(startDate.getTime() - 24 * 60 * 60 * 1000);
    
    const { error: reminderError } = await supabase
      .from("reminders")
      .insert({
        appointment_id: appointment.id,
        channel: "EMAIL",
        scheduled_at: reminderTime.toISOString(),
        payload: {
          type: "appointment_reminder",
          appointment_id: appointment.id,
        },
      });

    if (reminderError) {
      console.error("Failed to create reminder:", reminderError);
      // Don't fail the appointment creation for this
    }

    return new Response(
      JSON.stringify({
        success: true,
        appointment: appointment,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Create appointment error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);