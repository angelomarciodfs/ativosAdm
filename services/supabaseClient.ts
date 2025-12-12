
import { createClient } from '@supabase/supabase-js';

const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validação básica para evitar que o app quebre se o usuário colocar uma string inválida no .env (ex: "sua_url")
const isValidUrl = (url: string | undefined) => {
  try {
    return url && (url.startsWith('http://') || url.startsWith('https://'));
  } catch (e) {
    return false;
  }
};

// Se a URL do env for inválida ou inexistente, usamos um placeholder seguro.
// Isso impede o erro "Invalid supabaseUrl" e permite que o React renderize a tela de erro amigável.
const supabaseUrl = isValidUrl(envUrl) ? envUrl : 'https://placeholder.supabase.co';
const supabaseKey = envKey || 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Exporta flag indicando se a configuração REAL está presente
export const isConfigured = isValidUrl(envUrl) && !!envKey && envKey !== 'placeholder';
