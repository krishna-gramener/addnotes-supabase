import { initSupabase } from './supabaseConfig.js';
import { createNoteElement } from './noteElement.js';
// DOM Elements
const loginSection = document.getElementById("loginSection");
const appSection = document.getElementById("appSection");
const loginButton = document.getElementById("loginButton");
const logoutButton = document.getElementById("logoutButton");
const userEmail = document.getElementById("userEmail");
const noteInput = document.getElementById("noteInput");
const submitNote = document.getElementById("submitNote");
const notesList = document.getElementById("notesList");

// Initialize Supabase client
let supabase;

// Function to add a note
async function addNote() {
  const noteText = noteInput.value.trim();
  if (!noteText) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  try {
    const { error } = await supabase
      .from('notes')
      .insert([{
        text: noteText,
        user_id: user.id
      }]);
    
    if (error) throw error;
    noteInput.value = "";
    noteInput.focus();
  } catch (error) {
    console.error("Error adding note:", error);
    alert("Error adding note. Please try again.");
  }
}

// Function to setup real-time notes listener
async function setupNotesListener(userId) {
  try {
    await supabase.removeAllChannels();

    const channel = supabase.channel(`notes:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notes',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        notesList.querySelector('.empty-message')?.remove();
        const noteElement = createNoteElement(payload.new, supabase);
        notesList.insertBefore(noteElement, notesList.firstChild);
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'notes',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        const noteElement = notesList.querySelector(`[data-note-id="${payload.old.id}"]`) || 
                           notesList.querySelector(`button[data-id="${payload.old.id}"]`)?.closest('.list-group-item');
        if (noteElement) {
          noteElement.remove();
          if (notesList.children.length === 0) {
            notesList.innerHTML = `<div class="list-group-item text-center text-muted empty-message">
              No notes yet. Add your first note above!
            </div>`;
          }
        }
      })
      .subscribe(status => {
        if (status === 'SUBSCRIBED') {
          loadNotes(userId);
        }
      });

    return channel;
  } catch (error) {
    console.error('Error in setupNotesListener:', error);
    throw error;
  }
}

// Initial load of notes
async function loadNotes(userId) {
  try {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    notesList.innerHTML = "";
    if (!data || data.length === 0) {
      const emptyMessage = document.createElement("div");
      emptyMessage.className = "list-group-item text-center text-muted empty-message";
      emptyMessage.textContent = "No notes yet. Add your first note above!";
      notesList.appendChild(emptyMessage);
    } else {
      data.forEach(note => {
        const noteElement = createNoteElement(note, supabase);
        notesList.appendChild(noteElement);
      });
    }
  } catch (error) {
    console.error("Error loading notes:", error);
  }
}

// Initialize app when page loads
window.addEventListener('load', async () => {
  try {
    supabase = await initSupabase();
    if (!supabase) return;

    // Auth event handlers
    loginButton.addEventListener("click", () => 
      supabase.auth.signInWithOAuth({ provider: 'google' })
        .catch(error => console.error("Login error:", error))
    );

    logoutButton.addEventListener("click", () => 
      supabase.auth.signOut()
        .catch(error => console.error("Logout error:", error))
    );

    submitNote.addEventListener("click", addNote);

    // Handle auth state
    supabase.auth.onAuthStateChange((_, session) => {
      const isAuthenticated = !!session;
      loginSection.classList.toggle("hidden", isAuthenticated);
      appSection.classList.toggle("hidden", !isAuthenticated);
      userEmail.textContent = session?.user?.email || "";
      
      if (isAuthenticated) {
        loadNotes(session.user.id);
        setupNotesListener(session.user.id);
      } else {
        notesList.innerHTML = "";
      }
    });
  } catch (error) {
    console.error('Initialization error:', error);
  }
});
