export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      directory_listings: {
        Row: {
          id: string
          slug: string
          name: string
          city: string | null
          region_code: string | null
          country_code: string | null
          claim_status: string
          entity_type: string
          metadata: Json | null
          rank_score: number
          profile_completeness: number
          is_visible: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          city?: string | null
          region_code?: string | null
          country_code?: string | null
          claim_status?: string
          entity_type: string
          metadata?: Json | null
          rank_score?: number
          profile_completeness?: number
          is_visible?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          city?: string | null
          region_code?: string | null
          country_code?: string | null
          claim_status?: string
          entity_type?: string
          metadata?: Json | null
          rank_score?: number
          profile_completeness?: number
          is_visible?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      request_log: {
        Row: {
          id: string
          ip: string
          user_agent: string
          path: string
          is_bot: boolean
          created_at: string
          country: string | null
          city: string | null
          latitude: number | null
          longitude: number | null
        }
        Insert: {
          id?: string
          ip: string
          user_agent?: string
          path?: string
          is_bot?: boolean
          created_at?: string
          country?: string | null
          city?: string | null
          latitude?: number | null
          longitude?: number | null
        }
        Update: {
          id?: string
          ip?: string
          user_agent?: string
          path?: string
          is_bot?: boolean
          created_at?: string
          country?: string | null
          city?: string | null
          latitude?: number | null
          longitude?: number | null
        }
      }
      loads: {
        Row: {
          id: string
          broker_id: string
          origin_city: string
          origin_state: string
          destination_city: string
          destination_state: string
          equipment_type: string[]
          commodity: string
          dimensions: string
          weight: string
          posted_rate: number
          status: string
          pick_up_date: string
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["loads"]["Row"], "id" | "created_at"> & { id?: string, created_at?: string }
        Update: Partial<Omit<Database["public"]["Tables"]["loads"]["Row"], "id" | "created_at">>
      }
      load_bids: {
        Row: {
          id: string
          load_id: string
          operator_id: string
          bid_amount: number
          eta: string
          status: string
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["load_bids"]["Row"], "id" | "created_at"> & { id?: string, created_at?: string }
        Update: Partial<Omit<Database["public"]["Tables"]["load_bids"]["Row"], "id" | "created_at">>
      }
      escrow_payments: {
        Row: {
          id: string
          load_id: string
          bid_id: string
          amount: number
          status: string
          stripe_pi_id: string | null
          created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["escrow_payments"]["Row"], "id" | "created_at"> & { id?: string, created_at?: string }
        Update: Partial<Omit<Database["public"]["Tables"]["escrow_payments"]["Row"], "id" | "created_at">>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
