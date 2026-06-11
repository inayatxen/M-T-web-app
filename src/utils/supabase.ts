import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://uvqgavlqbnioqwfpjosc.supabase.co';
const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_lHSILme7-i1bhhsvQ6T4pA_hzXjcqXB';

export const supabase = createClient(supabaseUrl, supabaseKey);
