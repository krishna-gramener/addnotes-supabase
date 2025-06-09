const supabaseUrl = 'https://clziydecczxycuimshvx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNseml5ZGVjY3p4eWN1aW1zaHZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwOTUzNDMsImV4cCI6MjA2NDY3MTM0M30.y2dA5zmiYoTh2U2KqLC-a_bKM1wK3HsP-IDj8FZt_to';

let supabase = null;

export async function initSupabase() {
    try {
        if (!supabase && window.supabase) {
            supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
            const { error } = await supabase.auth.getSession();
            if (error) throw error;
        }
        return supabase;
    } catch (error) {
        console.error('Supabase init error:', error);
        return null;
    }
}
