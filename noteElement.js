export function createNoteElement(note, supabase) {
  const el = document.createElement('div');
  el.className = 'note';
  el.dataset.id = note.id;
  el.innerHTML = `
    <p>${note.text}</p>
    <time>${new Date(note.created_at).toLocaleString()}</time>
    <button>×</button>`;

  el.querySelector('button').onclick = async () => {
    try {
      const { error } = await supabase.from('notes').delete().eq('id', note.id);
      if (error) throw error;
      el.remove();
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete note');
    }
  };
  return el;
}
