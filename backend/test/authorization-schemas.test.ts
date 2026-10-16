import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addMemberSchema,
  moveTaskSchema,
  reorderColumnsSchema,
  updateMemberRoleSchema,
} from '../src/schemas/index.js';

test('membership invitations default to viewer and cannot grant ownership', () => {
  assert.deepEqual(
    addMemberSchema.parse({ email: 'person@example.com' }),
    { email: 'person@example.com', role: 'VIEWER' }
  );
  assert.equal(
    addMemberSchema.safeParse({ email: 'person@example.com', role: 'OWNER' }).success,
    false
  );
});

test('member role updates cannot grant workspace ownership', () => {
  assert.equal(updateMemberRoleSchema.safeParse({ role: 'EDITOR' }).success, true);
  assert.equal(updateMemberRoleSchema.safeParse({ role: 'OWNER' }).success, false);
});

test('task move ordering rejects duplicate task IDs', () => {
  const taskId = '7c95f8ec-7dee-4f61-be93-631d6a3a00a0';
  const targetColumnId = 'fa3772a9-2538-4f95-a1f0-8e24d0cc016d';

  assert.equal(
    moveTaskSchema.safeParse({
      targetColumnId,
      taskIdsOrder: [taskId, taskId],
    }).success,
    false
  );
});

test('column reordering requires at least one valid column ID', () => {
  assert.equal(reorderColumnsSchema.safeParse({ columnIds: [] }).success, false);
  assert.equal(reorderColumnsSchema.safeParse({ columnIds: ['not-a-uuid'] }).success, false);
});
