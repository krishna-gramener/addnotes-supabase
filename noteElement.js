// Function to create a note element
export function createNoteElement(note, supabase) {
  const div = document.createElement("div");
  div.className = "list-group-item";
  div.setAttribute('data-note-id', note.id);
  div.innerHTML = `
    ${note.text}
    <small class="text-muted">${new Date(note.created_at).toLocaleString()}</small>
    <button class="btn btn-danger btn-sm" data-id="${note.id}">Delete</button>
  `;

  // Add delete functionality
  const deleteBtn = div.querySelector('button');
  deleteBtn.addEventListener('click', async () => {
    try {
      // Disable button and show deleting state
      deleteBtn.disabled = true;
      deleteBtn.textContent = 'Deleting...';

      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', note.id);
      if (error) throw error;

      // Remove element immediately for better UX
      div.remove();
    } catch (error) {
      console.error("Error deleting note:", error);
      alert("Error deleting note. Please try again.");
      // Reset button state
      deleteBtn.disabled = false;
      deleteBtn.textContent = 'Delete';
    }
  });

  return div;
}
