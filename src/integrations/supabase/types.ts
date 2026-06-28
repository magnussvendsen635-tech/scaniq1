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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      blocked_users: {
        Row: {
          created_at: string
          device_fingerprint: string | null
          id: string
          ip_address: string | null
          reason: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          device_fingerprint?: string | null
          id?: string
          ip_address?: string | null
          reason?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          device_fingerprint?: string | null
          id?: string
          ip_address?: string | null
          reason?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      discount_codes: {
        Row: {
          active: boolean
          amount: number
          code: string
          created_at: string
          created_by: string | null
          currency: string | null
          description: string | null
          discount_type: string
          expires_at: string | null
          id: string
          max_uses: number | null
          times_used: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          amount?: number
          code: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          description?: string | null
          discount_type?: string
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          times_used?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          amount?: number
          code?: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          description?: string | null
          discount_type?: string
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          times_used?: number
          updated_at?: string
        }
        Relationships: []
      }
      discount_redemptions: {
        Row: {
          amount_saved_cents: number
          code_id: string
          code_text: string
          created_at: string
          currency: string
          id: string
          subscription_id: string | null
          user_id: string
        }
        Insert: {
          amount_saved_cents?: number
          code_id: string
          code_text: string
          created_at?: string
          currency?: string
          id?: string
          subscription_id?: string | null
          user_id: string
        }
        Update: {
          amount_saved_cents?: number
          code_id?: string
          code_text?: string
          created_at?: string
          currency?: string
          id?: string
          subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discount_redemptions_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_redemptions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          calories: number
          carbs: number
          cholesterol: number | null
          created_at: string
          fat: number
          fiber: number | null
          health_score: number
          id: string
          name: string
          protein: number
          saturated_fat: number | null
          sodium: number | null
          sugar: number | null
          user_id: string
        }
        Insert: {
          calories?: number
          carbs?: number
          cholesterol?: number | null
          created_at?: string
          fat?: number
          fiber?: number | null
          health_score?: number
          id?: string
          name: string
          protein?: number
          saturated_fat?: number | null
          sodium?: number | null
          sugar?: number | null
          user_id: string
        }
        Update: {
          calories?: number
          carbs?: number
          cholesterol?: number | null
          created_at?: string
          fat?: number
          fiber?: number | null
          health_score?: number
          id?: string
          name?: string
          protein?: number
          saturated_fat?: number | null
          sodium?: number | null
          sugar?: number | null
          user_id?: string
        }
        Relationships: []
      }
      meals: {
        Row: {
          calories: number
          carbs: number
          category: string | null
          cholesterol: number | null
          created_at: string
          eaten_at: string
          fat: number
          fiber: number | null
          health_score: number
          id: string
          name: string
          protein: number
          saturated_fat: number | null
          sodium: number | null
          sugar: number | null
          user_id: string
        }
        Insert: {
          calories?: number
          carbs?: number
          category?: string | null
          cholesterol?: number | null
          created_at?: string
          eaten_at?: string
          fat?: number
          fiber?: number | null
          health_score?: number
          id?: string
          name: string
          protein?: number
          saturated_fat?: number | null
          sodium?: number | null
          sugar?: number | null
          user_id: string
        }
        Update: {
          calories?: number
          carbs?: number
          category?: string | null
          cholesterol?: number | null
          created_at?: string
          eaten_at?: string
          fat?: number
          fiber?: number | null
          health_score?: number
          id?: string
          name?: string
          protein?: number
          saturated_fat?: number | null
          sodium?: number | null
          sugar?: number | null
          user_id?: string
        }
        Relationships: []
      }
      page_views: {
        Row: {
          created_at: string
          id: string
          path: string
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          path: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          path?: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      payouts: {
        Row: {
          amount_cents: number
          approved_at: string | null
          approved_by: string | null
          created_at: string
          currency: string
          id: string
          notes: string | null
          paid_at: string | null
          paid_by: string | null
          payout_date: string | null
          paypal_transaction_id: string | null
          status: Database["public"]["Enums"]["payout_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents?: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          paid_by?: string | null
          payout_date?: string | null
          paypal_transaction_id?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          paid_by?: string | null
          payout_date?: string | null
          paypal_transaction_id?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          acquisition_channel: string | null
          avatar_url: string | null
          ban_reason: string | null
          banned_at: string | null
          created_at: string
          daily_scan_count: number
          device_id: string | null
          display_name: string | null
          email: string | null
          email_verified_at: string | null
          id: string
          is_banned: boolean
          is_premium: boolean
          last_scan_at: string | null
          last_scan_date: string | null
          scan_count: number
          signup_ip: unknown
          updated_at: string
        }
        Insert: {
          acquisition_channel?: string | null
          avatar_url?: string | null
          ban_reason?: string | null
          banned_at?: string | null
          created_at?: string
          daily_scan_count?: number
          device_id?: string | null
          display_name?: string | null
          email?: string | null
          email_verified_at?: string | null
          id: string
          is_banned?: boolean
          is_premium?: boolean
          last_scan_at?: string | null
          last_scan_date?: string | null
          scan_count?: number
          signup_ip?: unknown
          updated_at?: string
        }
        Update: {
          acquisition_channel?: string | null
          avatar_url?: string | null
          ban_reason?: string | null
          banned_at?: string | null
          created_at?: string
          daily_scan_count?: number
          device_id?: string | null
          display_name?: string | null
          email?: string | null
          email_verified_at?: string | null
          id?: string
          is_banned?: boolean
          is_premium?: boolean
          last_scan_at?: string | null
          last_scan_date?: string | null
          scan_count?: number
          signup_ip?: unknown
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reminder_preferences: {
        Row: {
          calories: boolean
          created_at: string
          enabled: boolean
          meals: boolean
          timezone: string
          updated_at: string
          user_id: string
          water: boolean
          weight: boolean
        }
        Insert: {
          calories?: boolean
          created_at?: string
          enabled?: boolean
          meals?: boolean
          timezone?: string
          updated_at?: string
          user_id: string
          water?: boolean
          weight?: boolean
        }
        Update: {
          calories?: boolean
          created_at?: string
          enabled?: boolean
          meals?: boolean
          timezone?: string
          updated_at?: string
          user_id?: string
          water?: boolean
          weight?: boolean
        }
        Relationships: []
      }
      scans: {
        Row: {
          calories: number
          carbs: number | null
          created_at: string
          fat: number | null
          id: string
          image_url: string | null
          product_name: string
          protein: number | null
          scanned_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          calories?: number
          carbs?: number | null
          created_at?: string
          fat?: number | null
          id?: string
          image_url?: string | null
          product_name: string
          protein?: number | null
          scanned_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          calories?: number
          carbs?: number | null
          created_at?: string
          fat?: number | null
          id?: string
          image_url?: string | null
          product_name?: string
          protein?: number | null
          scanned_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount_paid_cents: number | null
          cancel_at_period_end: boolean | null
          created_at: string | null
          currency: string | null
          current_period_end: string | null
          current_period_start: string | null
          discount_code_id: string | null
          environment: string
          id: string
          paddle_customer_id: string
          paddle_subscription_id: string
          price_id: string
          product_id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount_paid_cents?: number | null
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          discount_code_id?: string | null
          environment?: string
          id?: string
          paddle_customer_id: string
          paddle_subscription_id: string
          price_id: string
          product_id: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount_paid_cents?: number | null
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          discount_code_id?: string | null
          environment?: string
          id?: string
          paddle_customer_id?: string
          paddle_subscription_id?: string
          price_id?: string
          product_id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_discount_code_id_fkey"
            columns: ["discount_code_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          activity: string
          age: number
          auto_adjust_goal: boolean
          calories_target: number
          carbs_target: number
          created_at: string
          diet: string
          fat_target: number
          frequency: string
          goal: string
          height_cm: number
          language: string
          last_active_date: string | null
          onboarded: boolean
          pace: string
          protein_target: number
          reminders_enabled: boolean
          reminders_meals: boolean
          reminders_water: boolean
          reminders_weight: boolean
          streak: number
          target_weight_kg: number
          updated_at: string
          user_id: string
          water_goal_ml: number
          weight_kg: number
        }
        Insert: {
          activity?: string
          age?: number
          auto_adjust_goal?: boolean
          calories_target?: number
          carbs_target?: number
          created_at?: string
          diet?: string
          fat_target?: number
          frequency?: string
          goal?: string
          height_cm?: number
          language?: string
          last_active_date?: string | null
          onboarded?: boolean
          pace?: string
          protein_target?: number
          reminders_enabled?: boolean
          reminders_meals?: boolean
          reminders_water?: boolean
          reminders_weight?: boolean
          streak?: number
          target_weight_kg?: number
          updated_at?: string
          user_id: string
          water_goal_ml?: number
          weight_kg?: number
        }
        Update: {
          activity?: string
          age?: number
          auto_adjust_goal?: boolean
          calories_target?: number
          carbs_target?: number
          created_at?: string
          diet?: string
          fat_target?: number
          frequency?: string
          goal?: string
          height_cm?: number
          language?: string
          last_active_date?: string | null
          onboarded?: boolean
          pace?: string
          protein_target?: number
          reminders_enabled?: boolean
          reminders_meals?: boolean
          reminders_water?: boolean
          reminders_weight?: boolean
          streak?: number
          target_weight_kg?: number
          updated_at?: string
          user_id?: string
          water_goal_ml?: number
          weight_kg?: number
        }
        Relationships: []
      }
      water_logs: {
        Row: {
          day: string
          ml: number
          updated_at: string
          user_id: string
        }
        Insert: {
          day: string
          ml?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          day?: string
          ml?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      weights: {
        Row: {
          created_at: string
          id: string
          logged_at: string
          user_id: string
          weight_kg: number
        }
        Insert: {
          created_at?: string
          id?: string
          logged_at?: string
          user_id: string
          weight_kg: number
        }
        Update: {
          created_at?: string
          id?: string
          logged_at?: string
          user_id?: string
          weight_kg?: number
        }
        Relationships: []
      }
      workouts: {
        Row: {
          calories_burned: number
          created_at: string
          id: string
          minutes: number
          name: string
          performed_at: string
          user_id: string
        }
        Insert: {
          calories_burned?: number
          created_at?: string
          id?: string
          minutes?: number
          name: string
          performed_at?: string
          user_id: string
        }
        Update: {
          calories_burned?: number
          created_at?: string
          id?: string
          minutes?: number
          name?: string
          performed_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_active_subscription: {
        Args: { check_env?: string; user_uuid: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_blocked: {
        Args: { _device?: string; _ip?: string; _user_id: string }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      payout_status: "pending" | "approved" | "paid" | "rejected"
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
      app_role: ["admin", "moderator", "user"],
      payout_status: ["pending", "approved", "paid", "rejected"],
    },
  },
} as const
