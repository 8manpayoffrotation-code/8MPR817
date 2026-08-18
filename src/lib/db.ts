import { supabase } from './supabase';

export const isSupabaseConfigured = !!import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'placeholder-url.supabase.co';

export const saveGame = async (game: any) => {
  if (isSupabaseConfigured) {
    const { error } = await supabase.from('game_logs').insert([game]);
    if (error) console.error("Error logging game:", error);
  } else {
    // Local fallback
    const logs = JSON.parse(localStorage.getItem('game_logs') || '[]');
    logs.push(game);
    localStorage.setItem('game_logs', JSON.stringify(logs));
  }
};

export const fetchGames = async () => {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('game_logs')
      .select('gm_name, score, skips_used, rank_tier')
      .eq('is_custom_draft', false);
    if (error) throw error;
    return data || [];
  } else {
    // Local fallback
    const logs = JSON.parse(localStorage.getItem('game_logs') || '[]');
    return logs.filter((log: any) => !log.is_custom_draft);
  }
};
