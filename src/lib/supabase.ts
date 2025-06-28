import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
});

// 데이터베이스 타입 정의
export interface Database {
  public: {
    Tables: {
      ingredients: {
        Row: {
          id: string;
          name: string;
          quantity?: string;
          category?: string;
          expiry_date?: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          quantity?: string;
          category?: string;
          expiry_date?: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          quantity?: string;
          category?: string;
          expiry_date?: string;
          user_id?: string;
          created_at?: string;
        };
      };
      recipes: {
        Row: {
          id: string;
          name: string;
          image?: string;
          ingredients: string;
          instructions: string;
          cooking_time: number;
          difficulty: "easy" | "medium" | "hard";
          servings: number;
          tags: string[];
          created_by: string;
          author_email?: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          image?: string;
          ingredients: string;
          instructions: string;
          cooking_time: number;
          difficulty: "easy" | "medium" | "hard";
          servings: number;
          tags: string[];
          created_by: string;
          author_email?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          image?: string;
          ingredients?: string;
          instructions?: string;
          cooking_time?: number;
          difficulty?: "easy" | "medium" | "hard";
          servings?: number;
          tags?: string[];
          created_by?: string;
          author_email?: string;
          created_at?: string;
        };
      };
    };
  };
}
