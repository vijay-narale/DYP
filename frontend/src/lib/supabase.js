import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://luieglqniwmkukuenqbu.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1aWVnbHFuaXdta3VrdWVucWJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzM3ODMsImV4cCI6MjA5MDg0OTc4M30.oD7KPmvim3IfcZamFwKGDmQwp-ArgA4F1VFPgOBJP_g';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
