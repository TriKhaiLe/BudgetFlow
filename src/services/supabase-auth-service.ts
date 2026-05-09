"use client";

import {
  createClient,
  type AuthChangeEvent,
  type Session,
} from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY,
);

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

function requireSupabaseClient() {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
  return supabase;
}

export const supabaseAuthService = {
  async login(email: string, password: string) {
    const client = requireSupabaseClient();
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new Error(error.message);
    if (!data.session) {
      throw new Error("Login successful but no session returned.");
    }

    return { session: data.session };
  },

  async signup(email: string, password: string) {
    const client = requireSupabaseClient();
    const { data, error } = await client.auth.signUp({
      email,
      password,
    });

    if (error) throw new Error(error.message);
    return { session: data.session };
  },

  async loginWithGoogle() {
    const client = requireSupabaseClient();
    const { error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });

    if (error) throw new Error(error.message);
  },

  async logout() {
    const client = requireSupabaseClient();
    const { error } = await client.auth.signOut();
    if (error) throw new Error(error.message);
  },

  async getCurrentSession(): Promise<Session | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.auth.getSession();
    if (error) return null;
    return data.session;
  },

  async getToken(): Promise<string | null> {
    const session = await this.getCurrentSession();
    return session?.access_token || null;
  },

  onAuthStateChange(
    callback: (
      event: AuthChangeEvent,
      session: Session | null,
    ) => void | Promise<void>,
  ) {
    if (!supabase) {
      return {
        unsubscribe: () => {},
      };
    }

    const { data } = supabase.auth.onAuthStateChange(callback);
    return {
      unsubscribe: () => data.subscription.unsubscribe(),
    };
  },
};
