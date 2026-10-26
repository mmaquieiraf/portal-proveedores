import { createClient } from '@supabase/supabase-js';

// 1. Extracción de variables desde el entorno (Soporta VITE_SUPABASE_ANON_KEY o VITE_SUPABASE_PUBLISHABLE_KEY)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
)?.trim();

// 2. Validación estricta (Fail-Fast Protocol)
function validateEnvVariables() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('🛑 CRÍTICO: Faltan variables de entorno de Supabase (VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY / VITE_SUPABASE_PUBLISHABLE_KEY).');
    throw new Error('Inicialización detenida: Configuración de seguridad incompleta en el entorno.');
  }

  try {
    new URL(supabaseUrl);
  } catch (error) {
    console.error('🛑 CRÍTICO: VITE_SUPABASE_URL no tiene un formato de URL válido.');
    throw new Error('Inicialización detenida: URL malformada.');
  }

  return { supabaseUrl, supabaseAnonKey };
}

const { supabaseUrl: validUrl, supabaseAnonKey: validKey } = validateEnvVariables();

// 3. Creación del cliente seguro
export const supabase = createClient(validUrl, validKey);