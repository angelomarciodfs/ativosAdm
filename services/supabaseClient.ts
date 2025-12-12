import { createClient } from '@supabase/supabase-js';

// Acesso seguro: se import.meta.env for undefined, usa objeto vazio para não quebrar o app
const envUrl = import.meta.env?.VITE_SUPABASE_URL;
const envKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;

// Credenciais fornecidas (Fallback)
const DEFAULT_URL = 'https://nrgfcvnsfovmdcyulhjd.supabase.co';
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yZ2Zjdm5zZm92bWRjeXVsaGpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1MTEzMDYsImV4cCI6MjA4MTA4NzMwNn0.d3O8xiCdNmbeaqJuywrTrWomYpSsP-1fjGNQkw_9S-8';

// Validação básica
const isValidUrl = (url: string | undefined): boolean => {
  try {
    return !!url && (url.startsWith('http://') || url.startsWith('https://'));
  } catch (e) {
    return false;
  }
};

// Lógica de fallback: Usa variável de ambiente se válida, senão usa a chave fornecida
const supabaseUrl = (envUrl && isValidUrl(envUrl)) ? envUrl : DEFAULT_URL;
const supabaseKey = envKey || DEFAULT_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Consideramos configurado se tivermos as credenciais padrão ou de ambiente
export const isConfigured = !!supabaseUrl && !!supabaseKey;