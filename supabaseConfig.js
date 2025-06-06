const supabaseUrl = 'https://clziydecczxycuimshvx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNseml5ZGVjY3p4eWN1aW1zaHZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwOTUzNDMsImV4cCI6MjA2NDY3MTM0M30.y2dA5zmiYoTh2U2KqLC-a_bKM1wK3HsP-IDj8FZt_to';

// Initialize Supabase client
let supabase = null;

async function initSupabase() {
    if (!window.supabase) {
        console.error('Supabase SDK not loaded');
        return null;
    }
    
    if (!supabase) {
        supabase = window.supabase.createClient(supabaseUrl, supabaseKey, {
            db: {
                schema: 'public'
            },
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                redirectTo: 'https://krishna-gramener.github.io/addnotes-supabase/'
            },
            realtime: {
                params: {
                    eventsPerSecond: 1
                },
                timeout: 60000,
                heartbeat: {
                    interval: 5000,
                    maxDelay: 10000
                }
            }
        });

        try {
            // Initialize auth and wait for it
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) throw error;
            console.log('Auth initialized', session ? 'with session' : 'without session');
        } catch (error) {
            console.error('Error initializing auth:', error);
            return null;
        }
    }
    
    return supabase;
}

export { initSupabase };
