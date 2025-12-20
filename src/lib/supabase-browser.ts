import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Crear cliente de Supabase con configuración optimizada
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: {
      getItem: async (key: string): Promise<string | null> => {
        if (typeof window === 'undefined') {
          return null;
        }
        try {
          const value = localStorage.getItem(key);
          if (!value) return null;
          // Si el valor comienza con 'base64-', es una cookie codificada en base64
          if (value.startsWith('base64-')) {
            try {
              const decodedValue = atob(value.slice(7));
              return decodedValue;
            } catch (e) {
              console.warn('Error decodificando cookie en base64:', e);
              return value;
            }
          }
          return value;
        } catch (e) {
          console.warn('Error accediendo a localStorage:', e);
          return null;
        }
      },
      setItem: async (key: string, value: string): Promise<void> => {
        if (typeof window === 'undefined') {
          return;
        }
        try {
          localStorage.setItem(key, value);
        } catch (error) {
          console.error('Error al guardar en localStorage:', error);
        }
      },
      removeItem: async (key: string): Promise<void> => {
        if (typeof window === 'undefined') {
          return;
        }
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.error('Error al eliminar de localStorage:', error);
        }
      }
    }
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