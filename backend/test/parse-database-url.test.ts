import assert from 'node:assert/strict';
import test from 'node:test';
import { parseDatabaseUrl } from '../src/config/parseDatabaseUrl.js';

test('database URL decodes credentials and database names', () => {
  assert.deepEqual(
    parseDatabaseUrl('mysql://kanban:p%40ss%3Aword@db.example:3307/mini%20kanban'),
    {
      host: 'db.example',
      port: 3307,
      user: 'kanban',
      password: 'p@ss:word',
      database: 'mini kanban',
    }
  );
});

test('database URL defaults to MariaDB port 3306', () => {
  assert.equal(
    parseDatabaseUrl('mysql://kanban:secret@localhost/minikanban').port,
    3306
  );
});

test('database URL rejects missing values and unsupported protocols', () => {
  assert.throws(() => parseDatabaseUrl(''), /DATABASE_URL must be configured/);
  assert.throws(
    () => parseDatabaseUrl('postgresql://kanban:secret@localhost/minikanban'),
    /mysql:\/\//
  );
  assert.throws(
    () => parseDatabaseUrl('mysql://kanban:secret@localhost'),
    /database name/
  );
});
