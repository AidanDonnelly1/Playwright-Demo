import { rm } from 'fs/promises';

export default async function globalSetup() {
  await rm('test.db', { force: true });
}
