'use strict';
/* Node test suite for Master Command Protocol Lab (app.js).
   Run: node --test test-master-command-lab.js  (or: node test-master-command-lab.js)
   Covers the demo core logic: command parsing, hub routing with R1/R2,
   direct-send blocking, R3 failover, R4 role-switching, the execution
   fabric with retry and rollback, receipt hashing/chaining, tamper detection. */
const test = require('node:test');
const assert = require('node:assert/strict');
const nodeCrypto = require('node:crypto');
const lab = require('./app.js');

function nodeSha256(str) {
  return nodeCrypto.createHash('sha256').update(str, 'utf8').digest('hex');
}

test('sha256Hex matches Node crypto on vectors', async () => {
  assert.equal(await lab.sha256Hex(''), nodeSha256(''));
  assert.equal(await lab.sha256Hex('abc'), nodeSha256('abc'));
  assert.equal(await lab.sha256Hex('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  assert.equal(await lab.sha256Hex('master command protocol'), nodeSha256('master command protocol'));
  assert.equal(await lab.sha256Hex('hub-and-spoke'), nodeSha256('hub-and-spoke'));
});

test('canonicalize sorts keys and keeps array order', () => {
  assert.equal(lab.canonicalize({ b: 1, a: { d: 4, c: 3 } }), '{"a":{"c":3,"d":4},"b":1}');
  assert.equal(lab.canonicalize([3, 1, 2]), '[3,1,2]');
  assert.equal(lab.canonicalize('x'), '"x"');
});

test('sourced constants: six spokes, four rules, six fabric stages, five layers', () => {
  assert.equal(lab.SPOKES.length, 6);
  assert.deepEqual(lab.SPOKES.map((s) => s.id), ['dispatch-iq', 'vla-arbitrage', 'baker-hvac', 'pulsar-dc', 'geointel', 'roof-ops']);
  assert.equal(lab.RULES.length, 4);
  assert.deepEqual(lab.RULES.map((r) => r.id), ['R1', 'R2', 'R3', 'R4']);
  assert.deepEqual(lab.FABRIC_STAGES, ['api-integrations', 'workflow-orchestration', 'automatic-retry', 'state-management', 'safety-constraints', 'rollback']);
  assert.equal(lab.LAYERS.length, 5);
  assert.deepEqual(lab.LAYERS.map((l) => l.id), ['L1', 'L2', 'L3', 'L4', 'L5']);
  assert.equal(lab.MAX_RETRIES, 3);
  assert.equal(lab.FAILOVER_BUDGET_MS, 200);
});

test('parseCommand accepts ROUTE and shows steps', () => {
  const p = lab.parseCommand('ROUTE roof-ops inspect-job-12');
  assert.equal(p.ok, true);
  assert.equal(p.verb, 'ROUTE');
  assert.deepEqual(p.args, ['roof-ops', 'inspect-job-12']);
  assert.equal(p.steps.length, 5);
  assert.ok(p.authority.indexOf('AUTO') === 0);
});

test('parseCommand is case-insensitive on the verb', () => {
  const p = lab.parseCommand('route roof-ops job-1');
  assert.equal(p.ok, true);
  assert.equal(p.verb, 'ROUTE');
});

test('parseCommand rejects empty, unknown verb, bad arity, unknown spoke', () => {
  assert.equal(lab.parseCommand('').ok, false);
  assert.equal(lab.parseCommand('   ').ok, false);
  const bad = lab.parseCommand('LAUNCH roof-ops job-1');
  assert.equal(bad.ok, false);
  assert.ok(bad.error.indexOf('Unknown verb') === 0);
  assert.equal(lab.parseCommand('ROUTE roof-ops').ok, false);
  assert.equal(lab.parseCommand('FAILOVER').ok, false);
  assert.equal(lab.parseCommand('ASSIGN roof-ops').ok, false);
  assert.equal(lab.parseCommand('RETRY').ok, false);
  assert.equal(lab.parseCommand('DIRECT roof-ops baker-hvac').ok, false);
  const spoke = lab.parseCommand('ROUTE not-a-spoke job-1');
  assert.equal(spoke.ok, false);
  assert.ok(spoke.error.indexOf('Unknown spoke') === 0);
  assert.equal(lab.parseCommand('STATUS HUB extra').ok, false);
});

test('parseCommand DIRECT and FAILOVER carry the right authority classes', () => {
  const d = lab.parseCommand('DIRECT roof-ops baker-hvac hello');
  assert.equal(d.ok, true);
  assert.ok(d.authority.indexOf('BLOCKED') === 0);
  const f = lab.parseCommand('FAILOVER baker-hvac');
  assert.equal(f.ok, true);
  assert.ok(f.authority.indexOf('HUB-DECISION') === 0);
  const r = lab.parseCommand('RETRY mcp-task-0001');
  assert.equal(r.ok, true);
  assert.ok(r.authority.indexOf('GUARD') === 0);
});

test('routeTask routes through the hub and records state on the hub (R2)', () => {
  const state = lab.newHubState();
  const r = lab.routeTask(state, 'roof-ops', 'inspect-job-12');
  assert.equal(r.ok, true);
  assert.equal(r.taskId, 'mcp-task-0001');
  assert.equal(r.spoke, 'ROOF-OPS');
  assert.equal(r.steps.length, 6);
  assert.equal(state.tasks['mcp-task-0001'].status, 'routed');
  assert.equal(state.tasks['mcp-task-0001'].spoke, 'roof-ops');
});

test('routeTask refuses an unknown spoke', () => {
  const state = lab.newHubState();
  const r = lab.routeTask(state, 'nope', 'job-1');
  assert.equal(r.ok, false);
  assert.ok(r.error.indexOf('Unknown spoke') === 0);
});

test('directAttempt is always BLOCKED by R1 and offers the hub path', () => {
  const r = lab.directAttempt('roof-ops', 'baker-hvac', 'handover-job-12');
  assert.equal(r.ok, false);
  assert.equal(r.blocked, true);
  assert.equal(r.rule, 'R1');
  assert.equal(r.reroute, 'ROUTE baker-hvac handover-job-12');
  assert.equal(r.steps.length, 4);
});

test('failover reroutes inside the under-200ms budget and blocks routing until run', () => {
  const state = lab.newHubState();
  state.queueDepth = 3;
  const f = lab.failover(state, 'baker-hvac');
  assert.equal(f.ok, true);
  assert.equal(f.standby, 'Baker HVAC dispatcher-B (standby twin)');
  assert.equal(f.simulated_ms, 70);
  assert.equal(f.within_budget, true);
  assert.equal(f.budget_ms, 200);
  const r = lab.routeTask(state, 'baker-hvac', 'job-9');
  assert.equal(r.ok, false);
  assert.equal(r.failover_needed, true);
});

test('failover simulated time is capped inside the budget at high queue depth', () => {
  const state = lab.newHubState();
  state.queueDepth = 500;
  const f = lab.failover(state, 'geointel');
  assert.equal(f.simulated_ms, 199);
  assert.equal(f.within_budget, true);
});

test('failover rejects an unknown spoke', () => {
  const state = lab.newHubState();
  assert.equal(lab.failover(state, 'nope').ok, false);
});

test('assignRole decisions follow the load rule: IDLE, BUSY, OVERLOAD', () => {
  const s1 = lab.newHubState();
  const idle = lab.assignRole(s1, 'geointel', 'scout', 1, 4);
  assert.equal(idle.ok, true);
  assert.equal(idle.load, 0.25);
  assert.ok(idle.decision.indexOf('IDLE') === 0);
  const s2 = lab.newHubState();
  const busy = lab.assignRole(s2, 'geointel', 'scout', 2, 4);
  assert.equal(busy.load, 0.5);
  assert.ok(busy.decision.indexOf('BUSY') === 0);
  const s3 = lab.newHubState();
  const over = lab.assignRole(s3, 'geointel', 'scout', 6, 4);
  assert.equal(over.load, 1.5);
  assert.ok(over.decision.indexOf('OVERLOAD') === 0);
  assert.equal(s3.roles['geointel'], 'scout');
});

test('assignRole rejects bad queue, bad capacity, unknown spoke', () => {
  const state = lab.newHubState();
  assert.equal(lab.assignRole(state, 'geointel', 'scout', -1, 4).ok, false);
  assert.equal(lab.assignRole(state, 'geointel', 'scout', 1.5, 4).ok, false);
  assert.equal(lab.assignRole(state, 'geointel', 'scout', 2, 0).ok, false);
  assert.equal(lab.assignRole(state, 'nope', 'scout', 2, 4).ok, false);
});

test('runFabric clean run completes all six stages', () => {
  const state = lab.newHubState();
  const r = lab.runFabric(state, 'book-roof-inspection', null);
  assert.equal(r.ok, true);
  assert.equal(r.taskId, 'mcp-task-0001');
  assert.equal(r.retries, 0);
  assert.equal(r.rolled_back, false);
  assert.equal(r.failed_stage, null);
  assert.equal(r.steps.length, 8);
  assert.equal(state.tasks['mcp-task-0001'].status, 'complete');
});

test('runFabric failure retries to the cap then rolls back in reverse order', () => {
  const state = lab.newHubState();
  const r = lab.runFabric(state, 'book-roof-inspection', 'state-management');
  assert.equal(r.ok, false);
  assert.equal(r.failed_stage, 'state-management');
  assert.equal(r.retries, 3);
  assert.equal(r.rolled_back, true);
  assert.equal(state.tasks['mcp-task-0001'].status, 'failed-rolled-back');
  const rollbackLines = r.steps.filter((s) => s.indexOf('Rollback: undo') === 0);
  assert.deepEqual(rollbackLines, [
    'Rollback: undo automatic-retry.',
    'Rollback: undo workflow-orchestration.',
    'Rollback: undo api-integrations.'
  ]);
});

test('runFabric failure at automatic-retry skips retry and goes straight to rollback', () => {
  const state = lab.newHubState();
  const r = lab.runFabric(state, 'task-x', 'automatic-retry');
  assert.equal(r.ok, false);
  assert.equal(r.retries, 0);
  assert.equal(r.rolled_back, true);
  assert.ok(r.steps.some((s) => s.indexOf('No retry is possible') !== -1));
});

test('retryTask retries a routed task and caps at three', () => {
  const state = lab.newHubState();
  const routed = lab.routeTask(state, 'roof-ops', 'job-1');
  assert.equal(routed.ok, true);
  for (let i = 1; i <= 3; i++) {
    const r = lab.retryTask(state, routed.taskId);
    assert.equal(r.ok, true);
    assert.equal(r.retries, i);
  }
  const capped = lab.retryTask(state, routed.taskId);
  assert.equal(capped.ok, false);
  assert.equal(capped.cap_reached, true);
  assert.equal(lab.retryTask(state, 'mcp-task-9999').ok, false);
});

test('retryTask refuses a completed task', () => {
  const state = lab.newHubState();
  const r = lab.runFabric(state, 'task-x', null);
  assert.equal(lab.retryTask(state, r.taskId).ok, false);
});

test('hubStatus reports hub state and per-spoke state', () => {
  const state = lab.newHubState();
  lab.routeTask(state, 'roof-ops', 'job-1');
  lab.routeTask(state, 'geointel', 'job-2');
  const hub = lab.hubStatus(state, 'HUB');
  assert.equal(hub.ok, true);
  assert.equal(hub.tasks, 2);
  assert.equal(hub.spokes, 6);
  const spoke = lab.hubStatus(state, 'roof-ops');
  assert.equal(spoke.ok, true);
  assert.equal(spoke.target, 'ROOF-OPS');
  assert.equal(spoke.failed, false);
  assert.equal(lab.hubStatus(state, 'nope').ok, false);
});

test('executeParsed runs a full command end to end', () => {
  const state = lab.newHubState();
  const ok = lab.executeParsed(state, lab.parseCommand('ROUTE dispatch-iq job-7'));
  assert.equal(ok.ok, true);
  assert.equal(ok.taskId, 'mcp-task-0001');
  const blocked = lab.executeParsed(state, lab.parseCommand('DIRECT roof-ops baker-hvac hello'));
  assert.equal(blocked.ok, false);
  assert.equal(blocked.blocked, true);
  const bad = lab.executeParsed(state, lab.parseCommand('LAUNCH x'));
  assert.equal(bad.ok, false);
});

test('receipt chain links, verify passes, tamper and bad link fail', async () => {
  const r1 = await lab.buildReceipt('mcp-20261114-0001', 'route',
    { task_id: 'mcp-task-0001' }, 'GENESIS', '2026-11-14T00:00:00.000Z');
  const r2 = await lab.buildReceipt('mcp-20261114-0002', 'failover',
    { spoke: 'baker-hvac' }, r1.provenance.report_hash_sha256, '2026-11-14T00:01:00.000Z');
  assert.equal(r2.prev_receipt_hash, r1.provenance.report_hash_sha256);
  assert.equal((await lab.verifyReceipt(r1, 'GENESIS')).pass, true);
  assert.equal((await lab.verifyReceipt(r2, r1.provenance.report_hash_sha256)).pass, true);
  assert.equal((await lab.verifyReceipt(r2, 'GENESIS')).pass, false);
  assert.equal((await lab.verifyReceipt(r2, 'GENESIS')).link_ok, false);
  const tampered = JSON.parse(JSON.stringify(r2));
  tampered.detail.spoke = 'geointel';
  const tv = await lab.verifyReceipt(tampered, r1.provenance.report_hash_sha256);
  assert.equal(tv.pass, false);
  assert.equal(tv.hash_ok, false);
  assert.equal(tv.link_ok, true);
});

test('receiptHash is stable across key order', async () => {
  const a = { format: 'receipt-v1.0', id: 'x', detail: { b: 2, a: 1 }, provenance: { report_hash_sha256: '' }, prev_receipt_hash: 'GENESIS', kind: 'route', created: 't' };
  const b = { created: 't', kind: 'route', prev_receipt_hash: 'GENESIS', provenance: { report_hash_sha256: '' }, id: 'x', detail: { a: 1, b: 2 }, format: 'receipt-v1.0' };
  assert.equal(await lab.receiptHash(a), await lab.receiptHash(b));
});

test('receiptHash matches Node crypto on canonical JSON', async () => {
  const r = await lab.buildReceipt('mcp-20261114-0001', 'route',
    { task_id: 'mcp-task-0001' }, 'GENESIS', '2026-11-14T00:00:00.000Z');
  const copy = JSON.parse(JSON.stringify(r));
  delete copy.provenance.report_hash_sha256;
  const expected = nodeSha256(lab.canonicalize(copy));
  assert.equal(r.provenance.report_hash_sha256, expected);
});

if (require.main === module) {
  // node test-master-command-lab.js without --test still runs via the test runner above.
}
