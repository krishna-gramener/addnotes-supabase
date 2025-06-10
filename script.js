const supabaseUrl = 'https://clziydecczxycuimshvx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNseml5ZGVjY3p4eWN1aW1zaHZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwOTUzNDMsImV4cCI6MjA2NDY3MTM0M30.y2dA5zmiYoTh2U2KqLC-a_bKM1wK3HsP-IDj8FZt_to';

const $ = id => document.getElementById(id);
const els = {login: $("loginSection"), app: $("appSection"), notes: $("notesList"), email: $("userEmail"), input: $("noteInput")};
let supabase = null;

async function initSupabase() {
  if (!supabase && window.supabase) {
    supabase = window.supabase.createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: true, autoRefreshToken: true }
    });
    await supabase.auth.getSession();
  }
  return supabase;
}

function createNoteElement(note, isHTML = false) {
  const el = document.createElement('div');
  el.className = 'note';
  el.dataset.id = note.id;
  el.innerHTML = `<p>${note.text}</p><time>${new Date(note.created_at).toLocaleString()}</time><button>×</button>`;

  const attachDelete = (element) => {
    const btn = element.querySelector('button');
    btn && (btn.onclick = async () => {
      const { error } = await supabase.from('notes').delete().eq('id', note.id);
      if (!error) {
        element.remove();
        !els.notes.querySelector('.note') && 
          (els.notes.innerHTML = '<div class="empty-message">No notes yet. Add your first note above!</div>');
      }
    });
  };

  if (!isHTML) {
    attachDelete(el);
    return el;
  }

  setTimeout(() => {
    const noteEl = els.notes.querySelector(`[data-id="${note.id}"]`);
    noteEl && attachDelete(noteEl);
  });

  return el.outerHTML;
}

async function addNote() {
  const text = els.input.value.trim();
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from("notes").insert([{ text, user_id: user.id }]);
  els.input.value = "";
  els.input.focus();
}

async function setupNotesListener(userId) {
  await supabase.removeAllChannels();
  const config = { schema: "public", table: "notes", filter: `user_id=eq.${userId}` };
  
  return supabase
    .channel(`notes:${userId}`)
    .on("postgres_changes", { ...config, event: "INSERT" }, ({ new: note }) => {
      const emptyMessage = els.notes.querySelector(".empty-message");
      if (emptyMessage) emptyMessage.remove();
      els.notes.insertBefore(createNoteElement(note), els.notes.firstChild);
    })
    .on("postgres_changes", { ...config, event: "DELETE" }, ({ old }) => {
      const noteElement = els.notes.querySelector(`[data-id="${old.id}"]`);
      if (noteElement) noteElement.remove();
      if (!els.notes.querySelector(':not(.empty-message)')) {
        els.notes.innerHTML = '<div class="empty-message">No notes yet. Add your first note above!</div>';
      }
    })
    .subscribe();
}

async function loadNotes(userId) {
  const { data } = await supabase.from("notes").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  els.notes.innerHTML = data.length
    ? data.map(note => createNoteElement(note, true)).join('')
    : '<div class="empty-message">No notes yet. Add your first note above!</div>';

  // Reattach event listeners for all notes
  if (data.length) {
    data.forEach(note => {
      const noteEl = els.notes.querySelector(`[data-id="${note.id}"]`);
      if (noteEl) {
        noteEl.querySelector('button').onclick = async () => {
          const { error } = await supabase.from('notes').delete().eq('id', note.id);
          if (!error) {
            noteEl.remove();
            if (!els.notes.querySelector('.note')) {
              els.notes.innerHTML = '<div class="empty-message">No notes yet. Add your first note above!</div>';
            }
          }
        };
      }
    });
  }
}

window.addEventListener("load", async () => {
  if (!(supabase = await initSupabase())) return;

  $("loginButton").onclick = () => supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: "https://krishna-gramener.github.io/addnotes-supabase/" }
  });
  $("logoutButton").onclick = () => supabase.auth.signOut();
  $("submitNote").onclick = addNote;

  supabase.auth.onAuthStateChange((_, session) => {
    const user = session?.user;
    els.login.classList.toggle("hidden", !!user);
    els.app.classList.toggle("hidden", !user);
    els.email.textContent = user?.email || "";
    user ? (loadNotes(user.id), setupNotesListener(user.id)) : (els.notes.innerHTML = "");
  });
});
