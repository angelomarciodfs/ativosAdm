
import { createClient } from '@supabase/supabase-js';

// Fallback seguro para as chaves
const DEFAULT_URL = 'https://nrgfcvnsfovmdcyulhjd.supabase.co';
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yZ2Zjdm5zZm92bWRjeXVsaGpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1MTEzMDYsImV4cCI6MjA4MTA4NzMwNn0.d3O8xiCdNmbeaqJuywrTrWomYpSsP-1fjGNQkw_9S-8';

// Exporting supabaseUrl and supabaseKey to fix import errors in App.tsx
export let supabaseUrl = DEFAULT_URL;
export let supabaseKey = DEFAULT_KEY;

// Tenta obter das variáveis de ambiente se disponível
try {
  // @ts-ignore - Evita erro de tipagem se a env não estiver definida
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // @ts-ignore
    const envUrl = import.meta.env.VITE_SUPABASE_URL;
    // @ts-ignore
    const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (envUrl && envUrl.startsWith('http')) supabaseUrl = envUrl;
    if (envKey) supabaseKey = envKey;
  }
} catch (e) {
  console.warn("Ambiente de variáveis não detectado, usando chaves padrão.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
export const isConfigured = !!supabaseUrl && !!supabaseKey;
