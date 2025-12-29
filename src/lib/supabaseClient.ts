import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if environment variables are configured
export const isSupabaseConfigured = !!(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'https://your-project-id.supabase.co' &&
    supabaseAnonKey !== 'your-anon-key-here'
);

// Create supabase client (or placeholder if not configured)
let supabaseInstance: SupabaseClient;

if (isSupabaseConfigured) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
} else {
    console.info(
        '🎨 Demo Mode: Supabase not configured. Using local mock data.\n' +
        'To connect to Supabase, add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.'
    );
    // Create with placeholder values - won't be used in demo mode
    supabaseInstance = createClient('https://demo.supabase.co', 'demo-key');
}

export const supabase = supabaseInstance;
