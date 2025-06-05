const supabaseUrl = '';
const supabaseKey = '';

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
                autoRefreshToken: true
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
