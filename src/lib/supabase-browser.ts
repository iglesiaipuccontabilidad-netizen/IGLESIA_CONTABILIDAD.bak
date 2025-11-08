import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let supabaseInstance: SupabaseClient<Database> | null = null;

export const supabase = (() => {
  if (supabaseInstance) return supabaseInstance;

  supabaseInstance = createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce', // Usar PKCE para mayor seguridad
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: { 'x-app-name': 'ipuc-contabilidad' },
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
        heartbeatIntervalMs: 5000,
        reconnectAfterMs: (retryCount: number): number => {
          // Estrategia de backoff exponencial con límite de 30 segundos
          return Math.min(1000 * Math.pow(2, retryCount), 30000);
        },
      },
    params: {
      eventsPerSecond: 10
    },
    heartbeatIntervalMs: 5000,
    reconnectAfterMs: (retryCount: number): number => {
      // Estrategia de backoff exponencial con límite de 30 segundos
      return Math.min(1000 * Math.pow(2, retryCount), 30000);
    }
  }
});