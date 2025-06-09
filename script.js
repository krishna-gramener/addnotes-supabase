import { initSupabase } from "./supabaseConfig.js";
import { createNoteElement } from "./noteElement.js";

const $ = (id) => document.getElementById(id);
const els = {login: $("loginSection"), app: $("appSection"), notes: $("notesList"), email: $("userEmail"), input: $("noteInput"),};

let supabase;

async function addNote() {
  const text = els.input.value.trim();
  if (!text) return;

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.from("notes").insert([{ text, user_id: user.id }]);
    els.input.value = "";
    els.input.focus();
  } catch {
    alert("Failed to add note");
  }
}

async function setupNotesListener(userId) {
  await supabase.removeAllChannels();
  const config = { schema: "public", table: "notes", filter: `user_id=eq.${userId}` };

  return supabase
    .channel(`notes:${userId}`)
    .on("postgres_changes", { ...config, event: "INSERT" }, ({ new: note }) => {
      els.notes.querySelector(".empty-message")?.remove();
      els.notes.insertBefore(createNoteElement(note, supabase), els.notes.firstChild);
    })
    .on("postgres_changes", { ...config, event: "DELETE" }, ({ old }) => {
      els.notes.querySelector(`[data-id="${old.id}"]`)?.remove();
      if (!els.notes.children.length) {
        els.notes.innerHTML = '<div class="empty-message">No notes yet. Add your first note above!</div>';
      }
    })
    .subscribe((status) => status === "SUBSCRIBED" && loadNotes(userId));
}

async function loadNotes(userId) {
  const { data } = await supabase
    .from("notes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .then((res) => (res.error ? { data: [] } : res));

  els.notes.innerHTML = '';
  if (data.length) {
    data.forEach(note => els.notes.appendChild(createNoteElement(note, supabase)));
  } else {
    els.notes.innerHTML = '<div class="empty-message">No notes yet. Add your first note above!</div>';
  }
}

window.addEventListener("load", async () => {
  if (!(supabase = await initSupabase())) return;

  $("loginButton").onclick = () =>
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: "https://krishna-gramener.github.io/addnotes-supabase/" },
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
