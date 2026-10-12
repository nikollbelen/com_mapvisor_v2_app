import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import ts from 'typescript';

// Exercise the real Worker route and real SQLite schema without touching production.
const source = readFileSync(new URL('../cloudflare/src/index.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } });
const { default: worker } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
const db = new DatabaseSync(':memory:');
db.exec(readFileSync(new URL('../cloudflare/migrations/0002_claims.sql', import.meta.url), 'utf8'));
const env = { APP_ORIGIN: 'http://localhost:5173', DB: {
  prepare(sql) {
    const statement = db.prepare(sql);
    return { bind(...args) { return { async run() { return statement.run(...args); }, async first() { return statement.get(...args); } }; } };
  },
} };
const fields = { submissionId: crypto.randomUUID(), name: 'Persona de prueba', document: '12345678', email: 'prueba@example.com', phone: '900000000', address: 'Lima', guardian: '', service: 'publicacion', type: 'reclamo', amount: '', detail: 'No puedo editar mi lote.', request: 'Solicito ayuda para editarlo.' };
const post = (body, targetEnv = env) => worker.fetch(new Request('https://example.com/api/claims', {
  method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:5173' }, body: JSON.stringify(body),
}), targetEnv);
const first = await post(fields);
assert.equal(first.status, 201);
assert.equal(first.headers.get('Access-Control-Allow-Origin'), 'http://localhost:5173');
assert.equal(first.headers.get('Cache-Control'), 'no-store');
const receipt = await first.json();
assert.match(receipt.claim.number, /^TUPU-/);
assert.ok(Number.isFinite(Date.parse(receipt.claim.createdAt)));
assert.deepEqual((await (await post(fields)).json()).claim, receipt.claim);
assert.equal(db.prepare('SELECT COUNT(*) AS count FROM claims').get().count, 1);
assert.equal(db.prepare('SELECT amount, status FROM claims').get().amount, null);
assert.equal(db.prepare('SELECT status FROM claims').get().status, 'pending');
assert.equal((await post({ ...fields, detail: 'Datos distintos' })).status, 409);
for (const changes of [{ email: 'invalid' }, { name: '   ' }, { type: 'otro' }, { service: 'invalid' }, { amount: '-1' }, { amount: 'abc' }, { detail: 'x'.repeat(5001) }, { submissionId: 'invalid' }]) {
  assert.equal((await post({ ...fields, ...changes })).status, 400);
}
assert.equal((await post(null)).status, 400);
assert.equal((await post({ ...fields, detail: 'x'.repeat(30001) })).status, 413);
assert.equal((await post({ ...fields, submissionId: crypto.randomUUID(), type: 'queja', service: 'busqueda', amount: '0' })).status, 201);
const unavailable = { ...env, DB: { prepare() { throw new Error('Database unavailable'); } } };
assert.equal((await post(fields, unavailable)).status, 503);
const get = await worker.fetch(new Request('https://example.com/api/claims'), env);
assert.equal(get.status, 404); // Consumer records have no public listing endpoint.
assert.equal(db.prepare('SELECT COUNT(*) AS count FROM claims').get().count, 2);
db.close();
console.log('Claims: persistence, retries, validation, database failures and privacy passed.');
