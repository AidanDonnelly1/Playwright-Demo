const toast = document.getElementById('toast');
let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
}

async function api(method, path, body) {
  const res = await fetch(path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

const id = window.location.pathname.split('/').pop();

const titleInput    = document.getElementById('title-input');
const doneCheckbox  = document.getElementById('done-checkbox');
const saveBtn       = document.getElementById('save-btn');
const cancelBtn     = document.getElementById('cancel-btn');
const deleteBtn     = document.getElementById('delete-btn');
const taskCard      = document.getElementById('task-card');
const notFound      = document.getElementById('not-found');
const pageHeading   = document.getElementById('page-heading');
const taskMetaHeader = document.getElementById('task-meta-header');
const createdAt     = document.getElementById('created-at');

let original = null;

async function loadTask() {
  try {
    const task = await api('GET', `/api/tasks/${id}`);
    original = task;
    pageHeading.textContent = task.title;
    document.title = `${task.title} — Task Manager`;
    titleInput.value = task.title;
    doneCheckbox.checked = !!task.done;
    taskMetaHeader.textContent = task.done ? 'Completed' : 'In progress';
    createdAt.textContent = `Created: ${new Date(task.created_at).toLocaleString()}`;
    taskCard.style.display = 'block';
  } catch {
    notFound.style.display = 'block';
  }
}

saveBtn.addEventListener('click', async () => {
  const title = titleInput.value.trim();
  if (!title) { showToast('Title cannot be empty'); return; }
  saveBtn.disabled = true;
  try {
    const updated = await api('PUT', `/api/tasks/${id}`, {
      title,
      done: doneCheckbox.checked,
    });
    original = updated;
    pageHeading.textContent = updated.title;
    document.title = `${updated.title} — Task Manager`;
    taskMetaHeader.textContent = updated.done ? 'Completed' : 'In progress';
    showToast('Task saved!');
  } catch (e) {
    showToast(e.message);
  } finally {
    saveBtn.disabled = false;
  }
});

cancelBtn.addEventListener('click', () => {
  if (original) {
    titleInput.value = original.title;
    doneCheckbox.checked = !!original.done;
  }
  window.location.href = '/tasks';
});

deleteBtn.addEventListener('click', async () => {
  if (!confirm('Delete this task?')) return;
  try {
    await api('DELETE', `/api/tasks/${id}`);
    window.location.href = '/tasks';
  } catch (e) {
    showToast(e.message);
  }
});

loadTask();
