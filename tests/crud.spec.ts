import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  // Clear all tasks before each test for isolation
  const tasks = await page.request.get('/api/tasks');
  const list = await tasks.json();
  for (const task of list) {
    await page.request.delete(`/api/tasks/${task.id}`);
  }
  await page.reload();
});

// ─── CREATE ───────────────────────────────────────────────────────────────────

test('create: adds a new task and shows it in the list', async ({ page }) => {
  await expect(page.getByText('No tasks yet')).toBeVisible();

  await page.getByLabel('New task title').fill('Buy groceries');
  await page.getByRole('button', { name: 'Add Task' }).click();

  await expect(page.getByTestId('task-title').filter({ hasText: 'Buy groceries' })).toBeVisible();
  await expect(page.getByText('No tasks yet')).toBeHidden();
  await expect(page.getByText('Task added!')).toBeVisible();
});

test('create: adds multiple tasks', async ({ page }) => {
  const tasks = ['Write tests', 'Review PR', 'Deploy to prod'];
  for (const title of tasks) {
    await page.getByLabel('New task title').fill(title);
    await page.getByRole('button', { name: 'Add Task' }).click();
    await expect(page.getByTestId('task-title').filter({ hasText: title })).toBeVisible();
  }
  await expect(page.getByTestId('task-title')).toHaveCount(3);
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

test('read: shows empty state when no tasks exist', async ({ page }) => {
  await expect(page.getByText('No tasks yet. Add one above!')).toBeVisible();
  await expect(page.getByTestId('task-title')).toHaveCount(0);
});

// ─── UPDATE ───────────────────────────────────────────────────────────────────

test('update: edits a task title', async ({ page }) => {
  await page.getByLabel('New task title').fill('Original title');
  await page.getByRole('button', { name: 'Add Task' }).click();
  await expect(page.getByTestId('task-title').filter({ hasText: 'Original title' })).toBeVisible();

  await page.getByRole('button', { name: 'Edit task' }).first().click();

  const editInput = page.getByLabel('Edit task title');
  await editInput.clear();
  await editInput.fill('Updated title');
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page.getByTestId('task-title').filter({ hasText: 'Updated title' })).toBeVisible();
  await expect(page.getByTestId('task-title').filter({ hasText: 'Original title' })).toHaveCount(0);
  await expect(page.getByText('Task updated')).toBeVisible();
});

test('update: marks a task as complete via checkbox', async ({ page }) => {
  await page.getByLabel('New task title').fill('Task to complete');
  await page.getByRole('button', { name: 'Add Task' }).click();

  const checkbox = page.getByLabel('Mark complete').first();
  await checkbox.check();

  await expect(page.getByText('Task completed!')).toBeVisible();
  await expect(checkbox).toBeChecked();

  const titleEl = page.getByTestId('task-title').first();
  await expect(titleEl).toHaveClass(/done/);
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

test('update: pressing Enter in edit input saves the task', async ({ page }) => {
  await page.getByLabel('New task title').fill('Press Enter to save');
  await page.getByRole('button', { name: 'Add Task' }).click();

  await page.getByRole('button', { name: 'Edit task' }).first().click();
  const editInput = page.getByLabel('Edit task title');
  await editInput.clear();
  await editInput.fill('Saved with Enter');
  await editInput.press('Enter');

  await expect(page.getByTestId('task-title').filter({ hasText: 'Saved with Enter' })).toBeVisible();
});

test('update: pressing Escape cancels edit', async ({ page }) => {
  await page.getByLabel('New task title').fill('Do not change me');
  await page.getByRole('button', { name: 'Add Task' }).click();

  await page.getByRole('button', { name: 'Edit task' }).first().click();
  const editInput = page.getByLabel('Edit task title');
  await editInput.clear();
  await editInput.fill('Changed but cancelled');
  await editInput.press('Escape');

  await expect(page.getByTestId('task-title').filter({ hasText: 'Do not change me' })).toBeVisible();
  await expect(page.getByTestId('task-title').filter({ hasText: 'Changed but cancelled' })).toHaveCount(0);
});

// ─── DELETE ───────────────────────────────────────────────────────────────────

test('delete: removes a task from the list', async ({ page }) => {
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
