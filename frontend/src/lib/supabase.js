import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zvqgkcxbwjfogwbfpqrj.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_f8XvOFSSnV5xeNXI7CycgA__f7iZLKg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
