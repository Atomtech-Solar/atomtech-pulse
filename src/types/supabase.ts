export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.1";
  };
  public: {
    Tables: {
      charging_sessions: {
        Row: {
          company_id: number;
          connector_id: number | null;
          created_at: string;
          duration_min: number | null;
          end_time: string | null;
          ev_user_id: number | null;
          external_id: string | null;
          id: number;
          kwh: number;
          revenue: number;
          start_time: string;
          station_id: number | null;
          status: string;
        };
        Insert: {
          company_id: number;
          connector_id?: number | null;
          created_at?: string;
          duration_min?: number | null;
          end_time?: string | null;
          ev_user_id?: number | null;
          external_id?: string | null;
          id?: number;
          kwh?: number;
          revenue?: number;
          start_time: string;
          station_id?: number | null;
          status?: string;
        };
        Update: {
          company_id?: number;
          connector_id?: number | null;
          created_at?: string;
          duration_min?: number | null;
          end_time?: string | null;
          ev_user_id?: number | null;
          external_id?: string | null;
          id?: number;
          kwh?: number;
          revenue?: number;
          start_time?: string;
          station_id?: number | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "charging_sessions_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "charging_sessions_connector_id_fkey";
            columns: ["connector_id"];
            isOneToOne: false;
            referencedRelation: "station_connectors";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "charging_sessions_ev_user_id_fkey";
            columns: ["ev_user_id"];
            isOneToOne: false;
            referencedRelation: "ev_users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "charging_sessions_station_id_fkey";
            columns: ["station_id"];
            isOneToOne: false;
            referencedRelation: "stations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "charging_sessions_station_id_fkey";
            columns: ["station_id"];
            isOneToOne: false;
            referencedRelation: "v_station_revenue";
            referencedColumns: ["station_id"];
          }
        ];
      };
      companies: {
        Row: {
          city: string | null;
          cnpj: string | null;
          created_at: string;
          id: number;
          name: string;
          stations_count: number;
          status: string;
          uf: string | null;
          users_count: number;
        };
        Insert: {
          city?: string | null;
          cnpj?: string | null;
          created_at?: string;
          id?: number;
          name: string;
          stations_count?: number;
          status?: string;
          uf?: string | null;
          users_count?: number;
        };
        Update: {
          city?: string | null;
          cnpj?: string | null;
          created_at?: string;
          id?: number;
          name?: string;
          stations_count?: number;
          status?: string;
          uf?: string | null;
          users_count?: number;
        };
        Relationships: [];
      };
      company_settings: {
        Row: {
          co2_factor: number;
          company_id: number;
          created_at: string;
          currency: string;
          id: number;
          timezone: string;
        };
        Insert: {
          co2_factor?: number;
          company_id: number;
          created_at?: string;
          currency?: string;
          id?: number;
          timezone?: string;
        };
        Update: {
          co2_factor?: number;
          company_id?: number;
          created_at?: string;
          currency?: string;
          id?: number;
          timezone?: string;
        };
        Relationships: [
          {
            foreignKeyName: "company_settings_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: true;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          }
        ];
      };
      ev_users: {
        Row: {
          company_id: number;
          created_at: string;
          document: string | null;
          id: number;
          name: string;
          sessions_count: number;
          status: string;
          total_kwh: number;
          vehicle: string | null;
        };
        Insert: {
          company_id: number;
          created_at?: string;
          document?: string | null;
          id?: number;
          name: string;
          sessions_count?: number;
          status?: string;
          total_kwh?: number;
          vehicle?: string | null;
        };
        Update: {
          company_id?: number;
          created_at?: string;
          document?: string | null;
          id?: number;
          name?: string;
          sessions_count?: number;
          status?: string;
          total_kwh?: number;
          vehicle?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ev_users_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          }
        ];
      };
      profiles: {
        Row: {
          company_id: number | null;
          created_at: string;
          email: string;
          name: string | null;
          phone: string | null;
          role: Database["public"]["Enums"]["user_role"];
          user_id: string;
        };
        Insert: {
          company_id?: number | null;
          created_at?: string;
          email: string;
          name?: string | null;
          phone?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          user_id: string;
        };
        Update: {
          company_id?: number | null;
          created_at?: string;
          email?: string;
          name?: string | null;
          phone?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          }
        ];
      };
      push_notifications: {
        Row: {
          company_id: number;
          created_at: string;
          id: number;
          message: string;
          recipients_count: number;
          status: string;
          title: string;
        };
        Insert: {
          company_id: number;
          created_at?: string;
          id?: number;
          message: string;
          recipients_count?: number;
          status?: string;
          title: string;
        };
        Update: {
          company_id?: number;
          created_at?: string;
          id?: number;
          message?: string;
          recipients_count?: number;
          status?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "push_notifications_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          }
        ];
      };
      station_connectors: {
        Row: {
          id: number;
          power_kw: number;
          station_id: number;
          status: string;
          type: string;
        };
        Insert: {
          id?: number;
          power_kw: number;
          station_id: number;
          status?: string;
          type: string;
        };
        Update: {
          id?: number;
          power_kw?: number;
          station_id?: number;
          status?: string;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "station_connectors_station_id_fkey";
            columns: ["station_id"];
            isOneToOne: false;
            referencedRelation: "stations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "station_connectors_station_id_fkey";
            columns: ["station_id"];
            isOneToOne: false;
            referencedRelation: "v_station_revenue";
            referencedColumns: ["station_id"];
          }
        ];
      };
      stations: {
        Row: {
          city: string | null;
          company_id: number;
          created_at: string;
          id: number;
          lat: number | null;
          lng: number | null;
          name: string;
          status: string;
          total_kwh: number;
          total_sessions: number;
          uf: string | null;
        };
        Insert: {
          city?: string | null;
          company_id: number;
          created_at?: string;
          id?: number;
          lat?: number | null;
          lng?: number | null;
          name: string;
          status?: string;
          total_kwh?: number;
          total_sessions?: number;
          uf?: string | null;
        };
        Update: {
          city?: string | null;
          company_id?: number;
          created_at?: string;
          id?: number;
          lat?: number | null;
          lng?: number | null;
          name?: string;
          status?: string;
          total_kwh?: number;
          total_sessions?: number;
          uf?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "stations_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          }
        ];
      };
      tariffs: {
        Row: {
          company_id: number;
          created_at: string;
          id: number;
          idle: number;
          idle_time_min: number;
          initial: number;
          op_fee: number;
          per_kwh: number;
          per_min: number;
          reserve: number;
          tax_percent: number;
          weekday: number;
        };
        Insert: {
          company_id: number;
          created_at?: string;
          id?: number;
          idle?: number;
          idle_time_min?: number;
          initial?: number;
          op_fee?: number;
          per_kwh?: number;
          per_min?: number;
          reserve?: number;
          tax_percent?: number;
          weekday: number;
        };
        Update: {
          company_id?: number;
          created_at?: string;
          id?: number;
          idle?: number;
          idle_time_min?: number;
          initial?: number;
          op_fee?: number;
          per_kwh?: number;
          per_min?: number;
          reserve?: number;
          tax_percent?: number;
          weekday?: number;
        };
        Relationships: [
          {
            foreignKeyName: "tariffs_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          }
        ];
      };
      vouchers: {
        Row: {
          code: string;
          company_id: number;
          created_at: string;
          daily: number | null;
          expiry_date: string | null;
          id: number;
          name: string;
          status: string;
          total: number;
          type: string;
          used: number;
        };
        Insert: {
          code: string;
          company_id: number;
          created_at?: string;
          daily?: number | null;
          expiry_date?: string | null;
          id?: number;
          name: string;
          status?: string;
          total: number;
          type: string;
          used?: number;
        };
        Update: {
          code?: string;
          company_id?: number;
          created_at?: string;
          daily?: number | null;
          expiry_date?: string | null;
          id?: number;
          name?: string;
          status?: string;
          total?: number;
          type?: string;
          used?: number;
        };
        Relationships: [
          {
            foreignKeyName: "vouchers_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      v_sessions_list: {
        Row: {
          company_id: number | null;
          duration_min: number | null;
          end_time: string | null;
          external_id: string | null;
          id: number | null;
          kwh: number | null;
          revenue: number | null;
          start_time: string | null;
          station_name: string | null;
          status: string | null;
          user_name: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "charging_sessions_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          }
        ];
      };
      v_station_revenue: {
        Row: {
          city: string | null;
          company_id: number | null;
          name: string | null;
          revenue: number | null;
          station_id: number | null;
          total_sessions: number | null;
          uf: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "stations_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Functions: {
      create_company_for_signup: {
        Args: {
          p_company_name: string;
          p_cnpj: string;
          p_user_email: string;
          p_user_name?: string;
        };
        Returns: number;
      };
      current_company_id: { Args: never; Returns: number };
      current_profile: {
        Args: never;
        Returns: {
          company_id: number | null;
          created_at: string;
          email: string;
          name: string | null;
          role: Database["public"]["Enums"]["user_role"];
          user_id: string;
        };
        SetofOptions: {
          from: "*";
          to: "profiles";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      current_role: {
        Args: never;
        Returns: Database["public"]["Enums"]["user_role"];
      };
      is_super_admin: { Args: never; Returns: boolean };
      same_company: { Args: { company_id: number }; Returns: boolean };
    };
    Enums: {
      user_role: "super_admin" | "company_admin" | "manager" | "viewer";
    };
    CompositeTypes: {
      [key: string]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals["public"];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
      DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      user_role: ["super_admin", "company_admin", "manager", "viewer"] as const
    }
  }
} as const;

