const supabaseUrl = 'https://clziydecczxycuimshvx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNseml5ZGVjY3p4eWN1aW1zaHZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwOTUzNDMsImV4cCI6MjA2NDY3MTM0M30.y2dA5zmiYoTh2U2KqLC-a_bKM1wK3HsP-IDj8FZt_to';
const $ = id => document.getElementById(id);
const els = {login: $("loginSection"), app: $("appSection"), notes: $("notesList"), email: $("userEmail"), input: $("noteInput")};
let supabase = null;
const EMPTY_MSG = '<div class="empty-message">No notes yet. Add your first note above!</div>';

async function initSupabase() {
  if (!supabase && window.supabase) {
    supabase = window.supabase.createClient(supabaseUrl, supabaseKey, {auth: {persistSession: true, autoRefreshToken: true}});
    await supabase.auth.getSession();
  }
  return supabase;
}

async function deleteNote(id, element) {
  const {error} = await supabase.from('notes').delete().eq('id', id);
  if (!error) {
    element.remove();
    if (!els.notes.querySelector('.note')) els.notes.innerHTML = EMPTY_MSG;
  }
}

function createNoteElement(note, isHTML = false) {
  const el = document.createElement('div');
  el.className = 'note';
  el.dataset.id = note.id;
  el.innerHTML = `<p>${note.text}</p><time>${new Date(note.created_at).toLocaleString()}</time><button>×</button>`;
  
  if (!isHTML) {
    const btn = el.querySelector('button');
    if (btn) btn.onclick = () => deleteNote(note.id, el);
    return el;
  }
  
  setTimeout(() => {
    const noteEl = els.notes.querySelector(`[data-id="${note.id}"]`);
    const btn = noteEl?.querySelector('button');
    if (btn) btn.onclick = () => deleteNote(note.id, noteEl);
  });
  return el.outerHTML;
}

async function addNote() {
  const text = els.input.value.trim();
  if (!text) return;
  const {data: {user}} = await supabase.auth.getUser();
  await supabase.from("notes").insert([{text, user_id: user.id}]);
  els.input.value = "";
  els.input.focus();
}

async function setupNotesListener(userId) {
  await supabase.removeAllChannels();
  const config = {schema: "public", table: "notes", filter: `user_id=eq.${userId}`};
  
  return supabase.channel(`notes:${userId}`)
    .on("postgres_changes", {...config, event: "INSERT"}, ({new: note}) => {
      const emptyMsg = els.notes.querySelector(".empty-message");
      if (emptyMsg) emptyMsg.remove();
      els.notes.insertBefore(createNoteElement(note), els.notes.firstChild);
    })
    .on("postgres_changes", {...config, event: "DELETE"}, ({old}) => {
      const noteEl = els.notes.querySelector(`[data-id="${old.id}"]`);
      if (noteEl) noteEl.remove();
      if (!els.notes.querySelector('.note')) els.notes.innerHTML = EMPTY_MSG;
    })
    .subscribe();
}

async function loadNotes(userId) {
  const {data} = await supabase.from("notes").select("*").eq("user_id", userId).order("created_at", {ascending: false});
  els.notes.innerHTML = data?.length ? data.map(note => createNoteElement(note, true)).join('') : EMPTY_MSG;
  
  data?.forEach(note => {
    const noteEl = els.notes.querySelector(`[data-id="${note.id}"]`);
    const btn = noteEl?.querySelector('button');
    if (btn) btn.onclick = () => deleteNote(note.id, noteEl);
  });
}

window.addEventListener("load", async () => {
  if (!(supabase = await initSupabase())) return;
  
  $("loginButton").onclick = () => supabase.auth.signInWithOAuth({provider: "google", options: {redirectTo: "https://krishna-gramener.github.io/addnotes-supabase/"}});
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
