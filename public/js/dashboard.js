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

async function loadStats() {
  const stats = await api('GET', '/api/stats');
  document.getElementById('stat-total').textContent     = stats.total;
  document.getElementById('stat-pending').textContent   = stats.pending;
  document.getElementById('stat-completed').textContent = stats.completed;
}

function renderRecentTask(task) {
  const row = document.createElement('div');
  row.className = 'task-row';

  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.checked = !!task.done;
  cb.setAttribute('aria-label', 'Mark complete');

  const link = document.createElement('a');
  link.href = `/tasks/${task.id}`;
  link.className = 'task-link' + (task.done ? ' done' : '');
  link.textContent = task.title;
  link.setAttribute('data-testid', 'task-title');

  cb.addEventListener('change', async () => {
    try {
      await api('PUT', `/api/tasks/${task.id}`, { done: cb.checked });
      link.className = 'task-link' + (cb.checked ? ' done' : '');
      await loadStats();
      showToast(cb.checked ? 'Task completed!' : 'Task reopened');
    } catch (e) {
      cb.checked = !cb.checked;
      showToast(e.message);
    }
  });

  row.append(cb, link);
  return row;
}

async function loadRecent() {
  const tasks = await api('GET', '/api/tasks');
  const list  = document.getElementById('recent-list');
  const empty = document.getElementById('empty-state');
  list.innerHTML = '';
  list.appendChild(empty);

  const recent = tasks.slice(0, 5);
  if (recent.length === 0) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  recent.forEach(t => list.appendChild(renderRecentTask(t)));
}

const quickInput = document.getElementById('quick-input');
const quickBtn   = document.getElementById('quick-btn');

async function quickAdd() {
  const title = quickInput.value.trim();
  if (!title) return;
  quickBtn.disabled = true;
  try {
    await api('POST', '/api/tasks', { title });
    quickInput.value = '';
    await Promise.all([loadStats(), loadRecent()]);
    showToast('Task added!');
  } catch (e) {
    showToast(e.message);
  } finally {
    quickBtn.disabled = false;
    quickInput.focus();
  }
}

quickBtn.addEventListener('click', quickAdd);
quickInput.addEventListener('keydown', e => { if (e.key === 'Enter') quickAdd(); });

loadStats();
loadRecent();
