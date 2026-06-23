import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  const tasks = await (await page.request.get('/api/tasks')).json();
  for (const task of tasks) {
    await page.request.delete(`/api/tasks/${task.id}`);
  }
  await page.goto('/tasks');
});

// ─── CREATE ───────────────────────────────────────────────────────────────────

test('create: adds a new task and shows it in the list', { tag: '@smoke' }, async ({ page }) => {
  await expect(page.getByText('No tasks yet')).toBeVisible();

  await page.getByLabel('New task title').fill('Buy groceries');
  await page.getByRole('button', { name: 'Add Task' }).click();

  await expect(page.getByTestId('task-title').filter({ hasText: 'Buy groceries' })).toBeVisible();
  await expect(page.getByText('No tasks yet')).toBeHidden();
  await expect(page.getByText('Task added!')).toBeVisible();
});

test('create: adds multiple tasks and shows correct count', async ({ page }) => {
  const tasks = ['Write tests', 'Review PR', 'Deploy to prod'];
  for (const title of tasks) {
    await page.getByLabel('New task title').fill(title);
    await page.getByRole('button', { name: 'Add Task' }).click();
    await expect(page.getByTestId('task-title').filter({ hasText: title })).toBeVisible();
  }
  await expect(page.getByTestId('task-title')).toHaveCount(3);
  await expect(page.locator('#task-count')).toHaveText('3 tasks');
});

test('create: pressing Enter adds a task', async ({ page }) => {
  await page.getByLabel('New task title').fill('Quick task');
  await page.getByLabel('New task title').press('Enter');
  await expect(page.getByTestId('task-title').filter({ hasText: 'Quick task' })).toBeVisible();
});

test('create: empty input does not add a task', async ({ page }) => {
  await page.getByRole('button', { name: 'Add Task' }).click();
  await expect(page.getByTestId('task-title')).toHaveCount(0);
});

// ─── READ ─────────────────────────────────────────────────────────────────────

test('read: tasks persist after page reload', async ({ page }) => {
  await page.getByLabel('New task title').fill('Persisted task');
  await page.getByRole('button', { name: 'Add Task' }).click();
  await expect(page.getByTestId('task-title').filter({ hasText: 'Persisted task' })).toBeVisible();

  await page.reload();

  await expect(page.getByTestId('task-title').filter({ hasText: 'Persisted task' })).toBeVisible();
});

test('read: shows empty state when no tasks exist', { tag: '@smoke' }, async ({ page }) => {
  await expect(page.getByText('No tasks yet. Add one above!')).toBeVisible();
  await expect(page.getByTestId('task-title')).toHaveCount(0);
});

// ─── UPDATE via task list ─────────────────────────────────────────────────────

test('update: marks a task as complete via checkbox on list page', { tag: '@smoke' }, async ({ page }) => {
  await page.getByLabel('New task title').fill('Task to complete');
  await page.getByRole('button', { name: 'Add Task' }).click();

  const checkbox = page.getByLabel('Mark complete').first();
  await checkbox.check();

  await expect(page.getByText('Task completed!')).toBeVisible();
  await expect(checkbox).toBeChecked();
  await expect(page.getByTestId('task-title').first()).toHaveClass(/done/);
});

test('update: unchecks a completed task', async ({ page }) => {
  await page.getByLabel('New task title').fill('Completed task');
  await page.getByRole('button', { name: 'Add Task' }).click();

  const checkbox = page.getByLabel('Mark complete').first();
  await checkbox.check();
  await expect(page.getByText('Task completed!')).toBeVisible();

  await checkbox.uncheck();
  await expect(page.getByText('Task reopened')).toBeVisible();
  await expect(checkbox).not.toBeChecked();
});

// ─── UPDATE via task detail page ──────────────────────────────────────────────

test('update: edits task title on the detail page', async ({ page }) => {
  await page.getByLabel('New task title').fill('Original title');
  await page.getByRole('button', { name: 'Add Task' }).click();
  await expect(page.getByTestId('task-title').filter({ hasText: 'Original title' })).toBeVisible();

  await page.getByTestId('task-title').filter({ hasText: 'Original title' }).click();
  await expect(page).toHaveURL(/\/tasks\/\d+/);

  await page.getByLabel('Task title').clear();
  await page.getByLabel('Task title').fill('Updated title');
  await page.getByRole('button', { name: 'Save Changes' }).click();

  await expect(page.getByText('Task saved!')).toBeVisible();
  await expect(page.getByLabel('Task title')).toHaveValue('Updated title');
});

test('update: marks task complete from the detail page', async ({ page }) => {
  await page.getByLabel('New task title').fill('Detail page complete');
  await page.getByRole('button', { name: 'Add Task' }).click();
  await page.getByTestId('task-title').filter({ hasText: 'Detail page complete' }).click();

  await page.getByLabel('Mark complete').check();
  await page.getByRole('button', { name: 'Save Changes' }).click();

  await expect(page.getByText('Task saved!')).toBeVisible();
  await expect(page.getByLabel('Mark complete')).toBeChecked();
});

// ─── DELETE ───────────────────────────────────────────────────────────────────

test('delete: removes a task from the list page', { tag: '@smoke' }, async ({ page }) => {
  await page.getByLabel('New task title').fill('Delete me');
  await page.getByRole('button', { name: 'Add Task' }).click();
  await expect(page.getByTestId('task-title').filter({ hasText: 'Delete me' })).toBeVisible();

  await page.getByRole('button', { name: 'Delete task' }).first().click();

  await expect(page.getByTestId('task-title').filter({ hasText: 'Delete me' })).toHaveCount(0);
  await expect(page.getByText('Task deleted')).toBeVisible();
});

test('delete: shows empty state after deleting the last task', async ({ page }) => {
  await page.getByLabel('New task title').fill('Only task');
  await page.getByRole('button', { name: 'Add Task' }).click();

  await page.getByRole('button', { name: 'Delete task' }).first().click();

  await expect(page.getByText('No tasks yet. Add one above!')).toBeVisible();
});

test('delete: deletes from detail page and redirects to list', async ({ page }) => {
  await page.getByLabel('New task title').fill('Delete from detail');
  await page.getByRole('button', { name: 'Add Task' }).click();
  await page.getByTestId('task-title').filter({ hasText: 'Delete from detail' }).click();

  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Delete Task' }).click();

  await expect(page).toHaveURL('/tasks');
  await expect(page.getByTestId('task-title').filter({ hasText: 'Delete from detail' })).toHaveCount(0);
});

test('delete: deletes the correct task when multiple exist', async ({ page }) => {
  for (const title of ['Keep me', 'Delete me', 'Keep me too']) {
    await page.getByLabel('New task title').fill(title);
    await page.getByRole('button', { name: 'Add Task' }).click();
    await expect(page.getByTestId('task-title').filter({ hasText: title })).toBeVisible();
  }
  await expect(page.getByTestId('task-title')).toHaveCount(3);

  // Tasks render newest-first; 'Delete me' is the middle one (index 1)
  await page.getByRole('button', { name: 'Delete task' }).nth(1).click();

  await expect(page.getByTestId('task-title')).toHaveCount(2);
  await expect(page.getByTestId('task-title').filter({ hasText: /^Delete me$/ })).toHaveCount(0);
  await expect(page.getByTestId('task-title').filter({ hasText: /^Keep me$/ })).toBeVisible();
  await expect(page.getByTestId('task-title').filter({ hasText: /^Keep me too$/ })).toBeVisible();
});
