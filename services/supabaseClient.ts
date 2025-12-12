import { createClient } from '@supabase/supabase-js';

const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validação básica
const isValidUrl = (url: string | undefined) => {
  try {
    return url && (url.startsWith('http://') || url.startsWith('https://'));
  } catch (e) {
    return false;
  }
};

// Lógica de fallback para evitar que o app quebre na inicialização
const supabaseUrl = isValidUrl(envUrl) ? envUrl : 'https://placeholder.supabase.co';
const supabaseKey = envKey || 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseKey);

export const isConfigured = isValidUrl(envUrl) && !!envKey && envKey !== 'placeholder';
