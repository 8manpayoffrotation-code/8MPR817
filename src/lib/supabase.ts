import { createClient } from '@supabase/supabase-js';

// Access environment variables using Vite's import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Throw a helpful error if the keys are missing
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Please add them in the AI Studio Settings > Environment Variables.');
}

// Format the URL defensively in case the user only provided the project ID
let formattedUrl = supabaseUrl || 'https://placeholder-url.supabase.co';
if (supabaseUrl && !supabaseUrl.startsWith('http')) {
  formattedUrl = `https://${supabaseUrl}.supabase.co`;
}

// Initialize the Supabase client (using empty strings as fallback to prevent crash if not set yet)
export const supabase = createClient(
  formattedUrl,
  supabaseAnonKey || 'placeholder-key'
);
