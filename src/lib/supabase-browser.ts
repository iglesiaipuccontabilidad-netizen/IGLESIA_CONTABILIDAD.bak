import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Crear cliente de Supabase con configuración optimizada
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // Mantener la sesión persistente
    autoRefreshToken: true, // Renovar tokens automáticamente
    detectSessionInUrl: true, // Detectar tokens en la URL después de OAuth
    flowType: 'pkce', // Usar PKCE para mayor seguridad
    storage: typeof window !== 'undefined' ? window.localStorage : undefined
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: { 'x-app-name': 'ipuc-contabilidad' }
  },
  realtime: {
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