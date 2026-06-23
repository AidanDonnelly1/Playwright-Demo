const input   = document.getElementById('new-task-input');
const addBtn  = document.getElementById('add-btn');
const list    = document.getElementById('task-list');
const empty   = document.getElementById('empty-state');
const toast   = document.getElementById('toast');

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

function renderTask(task) {
  const item = document.createElement('div');
  item.className = 'task-item';
  item.dataset.id = task.id;

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'task-checkbox';
  checkbox.checked = !!task.done;
  checkbox.setAttribute('aria-label', 'Mark complete');

  const titleSpan = document.createElement('span');
  titleSpan.className = 'task-title' + (task.done ? ' done' : '');
  titleSpan.textContent = task.title;
  titleSpan.setAttribute('data-testid', 'task-title');

  const actions = document.createElement('div');
  actions.className = 'task-actions';

  const editBtn   = document.createElement('button');
  editBtn.className = 'btn-edit';
  editBtn.textContent = 'Edit';
  editBtn.setAttribute('aria-label', 'Edit task');

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn-delete';
  deleteBtn.textContent = 'Delete';
  deleteBtn.setAttribute('aria-label', 'Delete task');

  actions.append(editBtn, deleteBtn);
  item.append(checkbox, titleSpan, actions);

  checkbox.addEventListener('change', async () => {
    try {
      const updated = await api('PUT', `/api/tasks/${task.id}`, { done: checkbox.checked });
      titleSpan.className = 'task-title' + (updated.done ? ' done' : '');
      showToast(updated.done ? 'Task completed!' : 'Task reopened');
    } catch (e) {
      checkbox.checked = !checkbox.checked;
      showToast(e.message);
    }
  });

  editBtn.addEventListener('click', () => {
    const editInput = document.createElement('input');
    editInput.type = 'text';
    editInput.className = 'task-edit-input';
    editInput.value = titleSpan.textContent;
    editInput.setAttribute('aria-label', 'Edit task title');

    const saveBtn   = document.createElement('button');
    saveBtn.className = 'btn-save';
    saveBtn.textContent = 'Save';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn-cancel';
    cancelBtn.textContent = 'Cancel';

    titleSpan.replaceWith(editInput);
    actions.innerHTML = '';
    actions.append(saveBtn, cancelBtn);
    editInput.focus();
    editInput.select();

    const cancelEdit = () => {
      editInput.replaceWith(titleSpan);
      actions.innerHTML = '';
      actions.append(editBtn, deleteBtn);
    };

    cancelBtn.addEventListener('click', cancelEdit);

    const doSave = async () => {
      const newTitle = editInput.value.trim();
      if (!newTitle) { showToast('Title cannot be empty'); return; }
      try {
        const updated = await api('PUT', `/api/tasks/${task.id}`, { title: newTitle });
        titleSpan.textContent = updated.title;
        task.title = updated.title;
        cancelEdit();
        showToast('Task updated');
      } catch (e) {
        showToast(e.message);
      }
    };

    saveBtn.addEventListener('click', doSave);
    editInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') doSave();
      if (e.key === 'Escape') cancelEdit();
    });
  });

  deleteBtn.addEventListener('click', async () => {
    try {
      await api('DELETE', `/api/tasks/${task.id}`);
      item.remove();
      updateEmpty();
      showToast('Task deleted');
    } catch (e) {
      showToast(e.message);
    }
  });

  return item;
}

function updateEmpty() {
  const hasTasks = list.querySelector('.task-item');
  empty.style.display = hasTasks ? 'none' : 'block';
}

async function loadTasks() {
  const tasks = await api('GET', '/api/tasks');
  list.innerHTML = '';
  list.appendChild(empty);
  empty.style.display = tasks.length ? 'none' : 'block';
  tasks.forEach(t => list.appendChild(renderTask(t)));
}

async function addTask() {
  const title = input.value.trim();
  if (!title) return;
  addBtn.disabled = true;
  try {
    const task = await api('POST', '/api/tasks', { title });
    input.value = '';
    empty.style.display = 'none';
    list.insertBefore(renderTask(task), list.children[1]);
    showToast('Task added!');
  } catch (e) {
    showToast(e.message);
  } finally {
    addBtn.disabled = false;
    input.focus();
  }
}

addBtn.addEventListener('click', addTask);
input.addEventListener('keydown', (e) => { if (e.key === 'Enter') addTask(); });

loadTasks();
