/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://uvqgavlqbnioqwfpjosc.supabase.co';
const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_lHSILme7-i1bhhsvQ6T4pA_hzXjcqXB';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Utility status check
export async function testSupabaseConnection(): Promise<{ success: boolean; message: string }> {
  try {
    // Attempting a simple metadata query to verify credentials and connectivity
    const { data, error } = await supabase.from('meters').select('id').limit(1);
    if (error) {
      // If error is about relation not existing, credentials are valid but tables aren't built yet
      if (error.code === '42P01') {
        return { success: true, message: 'Connected successfully! (Table schemas do not exist yet; click Seed to initialize)' };
      }
      return { success: false, message: `Connected to endpoint, but database returned error: ${error.message} (code: ${error.code})` };
    }
    return { success: true, message: 'Connected and synchronized with remote database!' };
  } catch (err: any) {
    return { success: false, message: `Could not connect: ${err.message || err}` };
  }
}
