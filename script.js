import { initSupabase } from './supabaseConfig.js';
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

// Function to create a note element
function createNoteElement(note) {
  const div = document.createElement("div");
  div.className = "list-group-item";
  div.innerHTML = `
    ${note.text}
    <small class="text-muted">${new Date(note.created_at).toLocaleString()}</small>
    <button class="btn btn-danger btn-sm" data-id="${note.id}">Delete</button>
  `;

  // Add delete functionality
  const deleteBtn = div.querySelector('button');
  deleteBtn.addEventListener('click', async () => {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', note.id);
      if (error) throw error;
    } catch (error) {
      console.error("Error deleting note:", error);
      alert("Error deleting note. Please try again.");
    }
  });

  return div;
}

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
function setupNotesListener(userId) {
  console.log('Setting up realtime listener for user:', userId);
  
  // First, clean up any existing subscriptions
  supabase.removeAllChannels();

  const channel = supabase
    .channel('public:notes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'notes', filter: `user_id=eq.${userId}` },
      (payload) => {
        console.log('Received realtime event:', payload);
        
        if (payload.eventType === 'INSERT') {
          console.log('Inserting new note:', payload.new);
          const noteElement = createNoteElement(payload.new);
          notesList.insertBefore(noteElement, notesList.firstChild);
        } 
        else if (payload.eventType === 'DELETE') {
          console.log('Deleting note:', payload.old);
          // Find the note element by its button's data-id
          const buttons = notesList.querySelectorAll('button[data-id]');
          for (const button of buttons) {
            if (button.getAttribute('data-id') === payload.old.id) {
              const noteElement = button.closest('.list-group-item');
              if (noteElement) {
                console.log('Found and removing note element');
                noteElement.remove();
                break;
              }
            }
          }
        }
      }
    )
    .subscribe((status) => {
      console.log('Subscription status:', status);
    });
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
    if (data.length === 0) {
      const emptyMessage = document.createElement("div");
      emptyMessage.className = "list-group-item text-center text-muted";
      emptyMessage.textContent = "No notes yet. Add your first note above!";
      notesList.appendChild(emptyMessage);
    } else {
      data.forEach(note => {
        const noteElement = createNoteElement(note);
        notesList.appendChild(noteElement);
      });
    }
  } catch (error) {
    console.error("Error loading notes:", error);
  }
}

// Wait for the page and Supabase SDK to load
window.addEventListener('load', async () => {
  // Initialize Supabase
  supabase = initSupabase();
  if (!supabase) {
    console.error('Failed to initialize Supabase');
    return;
  }

  // Login with Google
  loginButton.addEventListener("click", async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google'
      });
      if (error) throw error;
    } catch (error) {
      console.error("Error during login:", error);
      alert("Error during login. Please try again.");
    }
  });

  // Logout
  logoutButton.addEventListener("click", async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error("Error during logout:", error);
      alert("Error during logout. Please try again.");
    }
  });

  // Submit note on button click
  submitNote.addEventListener("click", addNote);

  // Listen for auth state changes
  supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
      // User is signed in
      loginSection.classList.add("hidden");
      appSection.classList.remove("hidden");
      userEmail.textContent = session.user.email;

      // Load initial notes and setup real-time listener
      loadNotes(session.user.id);
      setupNotesListener(session.user.id);
    } else {
      // User is signed out
      loginSection.classList.remove("hidden");
      appSection.classList.add("hidden");
      userEmail.textContent = "";
      notesList.innerHTML = "";
    }
  });
});
