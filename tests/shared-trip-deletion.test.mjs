import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const source = readFileSync(new URL('../app/api/shared-trips/[tripID]/route.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const tripID = 'a903ac4e-789b-4c7b-8970-ad9895c09f20';
function handler({ trusted = true, account = { id: 'owner' }, deleted = true } = {}) {
  const calls = [];
  const module = { exports: {} };
  const dependencies = {
    '@/lib/sessions': { isTrustedMutation: () => trusted, accountForRequest: async () => account },
    '@/lib/shared-trips': { deleteSharedTrip: async (...args) => { calls.push(args); return deleted; } },
  };
  new Function('require', 'module', 'exports', compiled)(name => dependencies[name] ?? require(name), module, module.exports);
  return { call: (id = tripID) => module.exports.DELETE({}, { params: Promise.resolve({ tripID: id }) }), calls };
}

test('trip deletion rejects untrusted requests before accessing storage', async () => {
  const h = handler({ trusted: false });
  assert.equal((await h.call()).status, 403);
  assert.deepEqual(h.calls, []);
});
test('trip deletion requires an authenticated account', async () => {
  const h = handler({ account: null });
  assert.equal((await h.call()).status, 401);
  assert.deepEqual(h.calls, []);
});
test('trip deletion rejects invalid identifiers before accessing storage', async () => {
  const h = handler();
  assert.equal((await h.call('invalid')).status, 400);
  assert.deepEqual(h.calls, []);
});
test('trip deletion does not report success for missing or non-owned groups', async () => {
  const h = handler({ deleted: false });
  assert.equal((await h.call()).status, 404);
});
test('trip deletion uses the authenticated owner and requested group', async () => {
  const h = handler();
  const response = await h.call();
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { deleted: true });
  assert.deepEqual(h.calls, [['owner', tripID]]);
});
