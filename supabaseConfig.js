const supabaseUrl = '';
const supabaseKey = '';

// Initialize Supabase client
let supabase = null;

function initSupabase() {
    if (!window.supabase) {
        console.error('Supabase SDK not loaded');
        return null;
    }
    
    if (!supabase) {
        supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
    }
    
    return supabase;
}

export { initSupabase };
