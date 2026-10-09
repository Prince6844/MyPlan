import { createClient, type SupabaseClient, type User, type Session } from '@supabase/supabase-js';

// Read environment variables or custom runtime storage
const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Stored config fallback in localStorage (allows user to enter credentials in Settings UI)
export const getStoredSupabaseConfig = () => {
  try {
    const url = localStorage.getItem('myplan_supabase_url') || envUrl;
    const key = localStorage.getItem('myplan_supabase_key') || envAnonKey;
    return { url, key };
  } catch {
    return { url: envUrl, key: envAnonKey };
  }
};

let supabaseClient: SupabaseClient | null = null;

export const initSupabase = (customUrl?: string, customKey?: string): SupabaseClient | null => {
  const { url, key } = {
    url: customUrl || getStoredSupabaseConfig().url,
    key: customKey || getStoredSupabaseConfig().key,
  };

  if (!url || !key || url.includes('placeholder')) {
    supabaseClient = null;
    return null;
  }

  try {
    supabaseClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    return supabaseClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    supabaseClient = null;
    return null;
  }
};

// Initialize on boot
initSupabase();

export const getSupabase = () => supabaseClient;

export const isSupabaseConfigured = () => {
  const { url, key } = getStoredSupabaseConfig();
  return Boolean(url && key && !url.includes('placeholder'));
};

export const saveSupabaseCredentials = (url: string, key: string) => {
  localStorage.setItem('myplan_supabase_url', url);
  localStorage.setItem('myplan_supabase_key', key);
  return initSupabase(url, key);
};

// ============================================================================
// Supabase Authentication Operations
// ============================================================================

export async function supabaseSignUp(email: string, password: string, name: string): Promise<{ user: User | null; session: Session | null; error: Error | null }> {
  const client = getSupabase();
  if (!client) {
    return { user: null, session: null, error: new Error('Supabase client is not configured.') };
  }

  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
        name: name,
      },
    },
  });

  return { user: data.user, session: data.session, error: error ? new Error(error.message) : null };
}

export async function supabaseSignIn(email: string, password: string): Promise<{ user: User | null; session: Session | null; error: Error | null }> {
  const client = getSupabase();
  if (!client) {
    return { user: null, session: null, error: new Error('Supabase client is not configured.') };
  }

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  return { user: data.user, session: data.session, error: error ? new Error(error.message) : null };
}

export async function supabaseSignOut(): Promise<{ error: Error | null }> {
  const client = getSupabase();
  if (!client) return { error: null };

  const { error } = await client.auth.signOut();
  return { error: error ? new Error(error.message) : null };
}

export async function supabaseResetPassword(email: string): Promise<{ error: Error | null }> {
  const client = getSupabase();
  if (!client) {
    return { error: new Error('Supabase client is not configured.') };
  }

  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/?action=reset_password`,
  });

  return { error: error ? new Error(error.message) : null };
}
