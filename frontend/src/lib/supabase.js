import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hvwdaaenmecuhhmotrmj.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2d2RhYWVubWVjdWhobW90cm1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzODQ3ODYsImV4cCI6MjA5MDk2MDc4Nn0.xPPq4wpYj6e2B_ooxRGTUhI-Cst_ckmv0Q8-N0qk6Sk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
