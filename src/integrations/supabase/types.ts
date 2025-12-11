export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          cancellation_at: string | null
          created_at: string | null
          customer_id: string | null
          deposit_cents: number | null
          deposit_paid_at: string | null
          end_at: string
          id: string
          note: string | null
          service_id: string | null
          source: Database["public"]["Enums"]["channel"] | null
          staff_id: string | null
          start_at: string
          status: Database["public"]["Enums"]["appointment_status"] | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          cancellation_at?: string | null
          created_at?: string | null
          customer_id?: string | null
          deposit_cents?: number | null
          deposit_paid_at?: string | null
          end_at: string
          id?: string
          note?: string | null
          service_id?: string | null
          source?: Database["public"]["Enums"]["channel"] | null
          staff_id?: string | null
          start_at: string
          status?: Database["public"]["Enums"]["appointment_status"] | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          cancellation_at?: string | null
          created_at?: string | null
          customer_id?: string | null
          deposit_cents?: number | null
          deposit_paid_at?: string | null
          end_at?: string
          id?: string
          note?: string | null
          service_id?: string | null
          source?: Database["public"]["Enums"]["channel"] | null
          staff_id?: string | null
          start_at?: string
          status?: Database["public"]["Enums"]["appointment_status"] | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          created_at: string | null
          id: string
          payload: Json | null
          tenant_id: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          payload?: Json | null
          tenant_id?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          payload?: Json | null
          tenant_id?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          consent_flags: Json | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          tags: string[] | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          consent_flags?: Json | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          tags?: string[] | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          consent_flags?: Json | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          tags?: string[] | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          appointment_id: string | null
          created_at: string | null
          id: string
          items: Json
          number: string
          paid_at: string | null
          pdf_url: string | null
          tenant_id: string | null
          total_cents: number
          vat_rate: number | null
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string | null
          id?: string
          items: Json
          number: string
          paid_at?: string | null
          pdf_url?: string | null
          tenant_id?: string | null
          total_cents: number
          vat_rate?: number | null
        }
        Update: {
          appointment_id?: string | null
          created_at?: string | null
          id?: string
          items?: Json
          number?: string
          paid_at?: string | null
          pdf_url?: string | null
          tenant_id?: string | null
          total_cents?: number
          vat_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      opening_hours: {
        Row: {
          fri_end: number | null
          fri_start: number | null
          id: string
          mon_end: number | null
          mon_start: number | null
          sat_end: number | null
          sat_start: number | null
          sun_end: number | null
          sun_start: number | null
          tenant_id: string | null
          thu_end: number | null
          thu_start: number | null
          tue_end: number | null
          tue_start: number | null
          wed_end: number | null
          wed_start: number | null
        }
        Insert: {
          fri_end?: number | null
          fri_start?: number | null
          id?: string
          mon_end?: number | null
          mon_start?: number | null
          sat_end?: number | null
          sat_start?: number | null
          sun_end?: number | null
          sun_start?: number | null
          tenant_id?: string | null
          thu_end?: number | null
          thu_start?: number | null
          tue_end?: number | null
          tue_start?: number | null
          wed_end?: number | null
          wed_start?: number | null
        }
        Update: {
          fri_end?: number | null
          fri_start?: number | null
          id?: string
          mon_end?: number | null
          mon_start?: number | null
          sat_end?: number | null
          sat_start?: number | null
          sun_end?: number | null
          sun_start?: number | null
          tenant_id?: string | null
          thu_end?: number | null
          thu_start?: number | null
          tue_end?: number | null
          tue_start?: number | null
          wed_end?: number | null
          wed_start?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "opening_hours_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          appointment_id: string | null
          channel: string
          id: string
          payload: Json | null
          scheduled_at: string
          sent_at: string | null
        }
        Insert: {
          appointment_id?: string | null
          channel: string
          id?: string
          payload?: Json | null
          scheduled_at: string
          sent_at?: string | null
        }
        Update: {
          appointment_id?: string | null
          channel?: string
          id?: string
          payload?: Json | null
          scheduled_at?: string
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reminders_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          duration_min: number
          id: string
          name: string
          price_cents: number
          tenant_id: string | null
          updated_at: string | null
          visible_online: boolean | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          duration_min: number
          id?: string
          name: string
          price_cents: number
          tenant_id?: string | null
          updated_at?: string | null
          visible_online?: boolean | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          duration_min?: number
          id?: string
          name?: string
          price_cents?: number
          tenant_id?: string | null
          updated_at?: string | null
          visible_online?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "services_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          booking_interval_min: number | null
          cancellation_hours: number | null
          currency: string | null
          deposit_cents: number | null
          enable_whatsapp: boolean | null
          id: string
          require_deposit: boolean | null
          sender_email: string | null
          sender_name: string | null
          tenant_id: string | null
          timezone: string | null
        }
        Insert: {
          booking_interval_min?: number | null
          cancellation_hours?: number | null
          currency?: string | null
          deposit_cents?: number | null
          enable_whatsapp?: boolean | null
          id?: string
          require_deposit?: boolean | null
          sender_email?: string | null
          sender_name?: string | null
          tenant_id?: string | null
          timezone?: string | null
        }
        Update: {
          booking_interval_min?: number | null
          cancellation_hours?: number | null
          currency?: string | null
          deposit_cents?: number | null
          enable_whatsapp?: boolean | null
          id?: string
          require_deposit?: boolean | null
          sender_email?: string | null
          sender_name?: string | null
          tenant_id?: string | null
          timezone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          active: boolean | null
          color_hex: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          skills: string[] | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          color_hex?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          skills?: string[] | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          color_hex?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          skills?: string[] | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_services: {
        Row: {
          id: string
          service_id: string | null
          staff_id: string | null
          tenant_id: string | null
        }
        Insert: {
          id?: string
          service_id?: string | null
          staff_id?: string | null
          tenant_id?: string | null
        }
        Update: {
          id?: string
          service_id?: string | null
          staff_id?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_services_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_services_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          features: Json | null
          id: string
          interval: string
          name: string
          price_cents: number
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          interval: string
          name: string
          price_cents: number
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          interval?: string
          name?: string
          price_cents?: number
        }
        Relationships: []
      }
      tenants: {
        Row: {
          address: string | null
          created_at: string | null
          domain: string | null
          email: string | null
          id: string
          locale: string | null
          logo_url: string | null
          name: string
          phone: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          domain?: string | null
          email?: string | null
          id?: string
          locale?: string | null
          logo_url?: string | null
          name: string
          phone?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          domain?: string | null
          email?: string | null
          id?: string
          locale?: string | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      time_blocks: {
        Row: {
          date: string | null
          end_min: number
          id: string
          note: string | null
          staff_id: string | null
          start_min: number
          tenant_id: string | null
          type: string
          weekday: number | null
        }
        Insert: {
          date?: string | null
          end_min: number
          id?: string
          note?: string | null
          staff_id?: string | null
          start_min: number
          tenant_id?: string | null
          type: string
          weekday?: number | null
        }
        Update: {
          date?: string | null
          end_min?: number
          id?: string
          note?: string | null
          staff_id?: string | null
          start_min?: number
          tenant_id?: string | null
          type?: string
          weekday?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "time_blocks_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_blocks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          created_at: string | null
          id: string
          plan_id: string | null
          status: string
          subscription_end_date: string | null
          subscription_start_date: string | null
          tenant_id: string
          trial_end_date: string | null
          trial_start_date: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          plan_id?: string | null
          status?: string
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          tenant_id: string
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          plan_id?: string | null
          status?: string
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          tenant_id?: string
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          id: string
          name: string
          phone: string | null
          role: Database["public"]["Enums"]["role"]
          tenant_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          phone?: string | null
          role: Database["public"]["Enums"]["role"]
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["role"]
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_tenant_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_subscription_status: {
        Args: { tenant_uuid: string }
        Returns: {
          is_trial_expired: boolean
          plan_name: string
          status: string
          trial_days_left: number
        }[]
      }
    }
    Enums: {
      appointment_status:
        | "PENDING"
        | "CONFIRMED"
        | "CANCELLED"
        | "COMPLETED"
        | "NO_SHOW"
      channel: "ONLINE" | "PHONE" | "WALKIN" | "WHATSAPP"
      role: "OWNER" | "STYLIST" | "RECEPTION"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      appointment_status: [
        "PENDING",
        "CONFIRMED",
        "CANCELLED",
        "COMPLETED",
        "NO_SHOW",
      ],
      channel: ["ONLINE", "PHONE", "WALKIN", "WHATSAPP"],
      role: ["OWNER", "STYLIST", "RECEPTION"],
    },
  },
} as const
