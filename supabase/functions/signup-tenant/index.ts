import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SignupRequest {
  email: string;
  password: string;
  salonName: string;
  ownerName: string;
  slug: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, salonName, ownerName, slug }: SignupRequest = await req.json();

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Check if slug is already taken
    const { data: existingTenant, error: slugError } = await supabaseAdmin
      .from("tenants")
      .select("id")
      .eq("slug", slug)
      .single();

    if (existingTenant) {
      return new Response(
        JSON.stringify({ error: "Dieser Slug ist bereits vergeben" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUser.users.some(user => user.email === email);

    let authData;
    if (userExists) {
      // If user exists, try to sign them in to get their data
      const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password,
      });
      
      if (signInError) {
        return new Response(
          JSON.stringify({ error: "Email bereits registriert. Bitte verwenden Sie eine andere Email oder melden Sie sich an." }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      authData = signInData;
    } else {
      // Create new user
      const { data: newUserData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm for demo
      });

      if (authError) {
        throw authError;
      }

      authData = newUserData;
    }

    if (!authData.user) {
      throw new Error("Failed to create or authenticate user");
    }

    // Create tenant
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from("tenants")
      .insert({
        name: salonName,
        slug: slug,
        email: email,
        locale: "de-DE",
      })
      .select()
      .single();

    if (tenantError) {
      // Clean up user if tenant creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw tenantError;
    }

    // Create user profile
    const { error: userError } = await supabaseAdmin
      .from("users")
      .insert({
        user_id: authData.user.id,
        tenant_id: tenant.id,
        name: ownerName,
        role: "OWNER",
      });

    if (userError) {
      // Clean up on error
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      await supabaseAdmin.from("tenants").delete().eq("id", tenant.id);
      throw userError;
    }

    // Create default settings
    const { error: settingsError } = await supabaseAdmin
      .from("settings")
      .insert({
        tenant_id: tenant.id,
        booking_interval_min: 15,
        require_deposit: false,
        cancellation_hours: 24,
        enable_whatsapp: false,
        timezone: "Europe/Zurich",
      });

    if (settingsError) {
      console.error("Failed to create default settings:", settingsError);
      // Don't fail the signup for this
    }

    // Create default opening hours
    const { error: hoursError } = await supabaseAdmin
      .from("opening_hours")
      .insert({
        tenant_id: tenant.id,
        mon_start: 540, // 09:00
        mon_end: 1080,  // 18:00
        tue_start: 540,
        tue_end: 1080,
        wed_start: 540,
        wed_end: 1080,
        thu_start: 540,
        thu_end: 1080,
        fri_start: 540,
        fri_end: 1080,
        sat_start: 600, // 10:00
        sat_end: 960,   // 16:00
        sun_start: null,
        sun_end: null,
      });

    if (hoursError) {
      console.error("Failed to create default opening hours:", hoursError);
      // Don't fail the signup for this
    }

    // Create default services
    const defaultServices = [
      {
        tenant_id: tenant.id,
        name: "Damenhaarschnitt",
        description: "Professioneller Haarschnitt für Damen",
        duration_min: 45,
        price_cents: 4500,
        visible_online: true,
        active: true,
      },
      {
        tenant_id: tenant.id,
        name: "Herrenhaarschnitt",
        description: "Klassischer Herrenhaarschnitt",
        duration_min: 30,
        price_cents: 3500,
        visible_online: true,
        active: true,
      },
      {
        tenant_id: tenant.id,
        name: "Farbe + Schnitt",
        description: "Komplette Typveränderung",
        duration_min: 120,
        price_cents: 8900,
        visible_online: true,
        active: true,
      },
    ];

    const { error: servicesError } = await supabaseAdmin
      .from("services")
      .insert(defaultServices);

    if (servicesError) {
      console.error("Failed to create default services:", servicesError);
      // Don't fail the signup for this
    }

    return new Response(
      JSON.stringify({
        success: true,
        tenant: tenant,
        user: authData.user,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Signup error:", error);
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