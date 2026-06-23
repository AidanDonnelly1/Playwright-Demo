import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  const tasks = await (await page.request.get('/api/tasks')).json();
  for (const task of tasks) {
    await page.request.delete(`/api/tasks/${task.id}`);
  }
});

// ─── Dashboard ────────────────────────────────────────────────────────────────

test('dashboard: shows correct stats with no tasks', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#stat-total')).toHaveText('0');
  await expect(page.locator('#stat-pending')).toHaveText('0');
  await expect(page.locator('#stat-completed')).toHaveText('0');
  await expect(page.getByText('No tasks yet.')).toBeVisible();
});

test('dashboard: stats update after adding a task via quick-add', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Quick add task').fill('Dashboard task');
  await page.getByRole('button', { name: 'Add Task' }).click();

  await expect(page.locator('#stat-total')).toHaveText('1');
  await expect(page.locator('#stat-pending')).toHaveText('1');
  await expect(page.locator('#stat-completed')).toHaveText('0');
  await expect(page.getByTestId('task-title').filter({ hasText: 'Dashboard task' })).toBeVisible();
});

test('dashboard: stats reflect completed tasks', async ({ page }) => {
  await page.request.post('/api/tasks', { data: { title: 'Task A' } });
  await page.request.post('/api/tasks', { data: { title: 'Task B' } });

  await page.goto('/');
  await expect(page.locator('#stat-total')).toHaveText('2');

  const tasks = await (await page.request.get('/api/tasks')).json();
  await page.request.put(`/api/tasks/${tasks[0].id}`, { data: { done: true } });

  await page.reload();
  await expect(page.locator('#stat-completed')).toHaveText('1');
  await expect(page.locator('#stat-pending')).toHaveText('1');
});

// ─── Navigation ───────────────────────────────────────────────────────────────

test('navigation: nav links route between pages', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL('/');
  await expect(page.locator('nav a.active')).toHaveText('Dashboard');

  await page.getByRole('navigation').getByRole('link', { name: 'Tasks' }).click();
  await expect(page).toHaveURL('/tasks');
  await expect(page.locator('nav a.active')).toHaveText('Tasks');

  await page.getByRole('navigation').getByRole('link', { name: 'Dashboard' }).click();
  await expect(page).toHaveURL('/');
  await expect(page.locator('nav a.active')).toHaveText('Dashboard');
});

test('navigation: clicking a task title on dashboard navigates to its detail page', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Quick add task').fill('Navigate to me');
  await page.getByRole('button', { name: 'Add Task' }).click();
  await expect(page.getByTestId('task-title').filter({ hasText: 'Navigate to me' })).toBeVisible();

  await page.getByTestId('task-title').filter({ hasText: 'Navigate to me' }).click();
  await expect(page).toHaveURL(/\/tasks\/\d+/);
  await expect(page.getByLabel('Task title')).toHaveValue('Navigate to me');
});

test('navigation: clicking a task title on list page navigates to detail', async ({ page }) => {
  await page.goto('/tasks');
  await page.getByLabel('New task title').fill('Click me');
  await page.getByRole('button', { name: 'Add Task' }).click();
  await expect(page.getByTestId('task-title').filter({ hasText: 'Click me' })).toBeVisible();

  await page.getByTestId('task-title').filter({ hasText: 'Click me' }).click();

  await expect(page).toHaveURL(/\/tasks\/\d+/);
  await expect(page.getByLabel('Task title')).toHaveValue('Click me');
});

test('navigation: back button on detail page returns to task list', async ({ page }) => {
  await page.goto('/tasks');
  await page.getByLabel('New task title').fill('Back button test');
  await page.getByRole('button', { name: 'Add Task' }).click();
  await page.getByTestId('task-title').filter({ hasText: 'Back button test' }).click();

  await expect(page).toHaveURL(/\/tasks\/\d+/);
  await page.getByRole('button', { name: 'Cancel' }).click();

  await expect(page).toHaveURL('/tasks');
});

test('navigation: brand logo always navigates to dashboard', async ({ page }) => {
  await page.goto('/tasks');
  await page.getByRole('link', { name: 'Task Manager' }).click();
  await expect(page).toHaveURL('/');
});

test('navigation: detail page shows 404 state for missing task', async ({ page }) => {
  await page.goto('/tasks/99999');
  await expect(page.getByText('Task not found')).toBeVisible();
});
