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

const list    = document.getElementById('task-list');
const empty   = document.getElementById('empty-state');
const counter = document.getElementById('task-count');

function updateCount() {
  const n = list.querySelectorAll('.task-row').length;
  counter.textContent = n === 0 ? '' : `${n} task${n !== 1 ? 's' : ''}`;
}

function renderTask(task) {
  const row = document.createElement('div');
  row.className = 'task-row';
  row.dataset.id = task.id;

  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.checked = !!task.done;
  cb.setAttribute('aria-label', 'Mark complete');

  const link = document.createElement('a');
  link.href = `/tasks/${task.id}`;
  link.className = 'task-link' + (task.done ? ' done' : '');
  link.textContent = task.title;
  link.setAttribute('data-testid', 'task-title');

  const actions = document.createElement('div');
  actions.className = 'task-actions';

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn btn-danger btn-sm';
  deleteBtn.textContent = 'Delete';
  deleteBtn.setAttribute('aria-label', 'Delete task');

  actions.append(deleteBtn);
  row.append(cb, link, actions);

  cb.addEventListener('change', async () => {
    try {
      const updated = await api('PUT', `/api/tasks/${task.id}`, { done: cb.checked });
      link.className = 'task-link' + (updated.done ? ' done' : '');
      showToast(updated.done ? 'Task completed!' : 'Task reopened');
    } catch (e) {
      cb.checked = !cb.checked;
      showToast(e.message);
    }
  });

  deleteBtn.addEventListener('click', async () => {
    try {
      await api('DELETE', `/api/tasks/${task.id}`);
      row.remove();
      updateCount();
      if (!list.querySelector('.task-row')) empty.style.display = 'block';
      showToast('Task deleted');
    } catch (e) {
      showToast(e.message);
    }
  });

  return row;
}

async function loadTasks() {
  const tasks = await api('GET', '/api/tasks');
  list.innerHTML = '';
  list.appendChild(empty);
  empty.style.display = tasks.length ? 'none' : 'block';
  tasks.forEach(t => list.appendChild(renderTask(t)));
  updateCount();
}

const input  = document.getElementById('new-task-input');
const addBtn = document.getElementById('add-btn');

async function addTask() {
  const title = input.value.trim();
  if (!title) return;
  addBtn.disabled = true;
  try {
    const task = await api('POST', '/api/tasks', { title });
    input.value = '';
    empty.style.display = 'none';
    list.insertBefore(renderTask(task), list.children[1]);
    updateCount();
    showToast('Task added!');
  } catch (e) {
    showToast(e.message);
  } finally {
    addBtn.disabled = false;
    input.focus();
  }
}

addBtn.addEventListener('click', addTask);
input.addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });

loadTasks();
