'use strict';
/* Master Command Protocol Lab. Static demo, no backend, nothing leaves the page. */
/* SIMULATION throughout: this page re-implements the sourced hub-and-spoke
   pattern rules and the sourced execution-fabric stages in the browser. It
   does not run any Neuruh system, does not route to a real agent, does not
   connect to any repo, database, or live system. */
/* Sourced mechanics only: hub-and-spoke pattern rules R1-R4 and the applied
   systems list come from IP Registry row AI-FW-018. The execution fabric
   stages come from row AI-FW-002. The five layers (NUOL) and the L2
   components come from the Notion execution plan 31fa981d-75b6-8132-87c1-f85d5c2d5e9d.
   The command grammar, the spoke single-function labels, the standby twins,
   the authority classes, and all numbers the sources do not state are
   builder design decisions (mine), labeled as such on the page. */

/* PURE LOGIC - also tested in Node (see test-master-command-lab.js) */

/* SHA-256 via Web Crypto (async). Same call path in the browser and in
   Node (Node 18+ exposes globalThis.crypto.subtle). */
async function sha256Hex(str) {
  var data = new TextEncoder().encode(str);
  var buf = await globalThis.crypto.subtle.digest('SHA-256', data);
  var bytes = new Uint8Array(buf);
  var out = '';
  for (var i = 0; i < bytes.length; i++) {
    out += (bytes[i] < 16 ? '0' : '') + bytes[i].toString(16);
  }
  return out;
}

function canonicalize(v) {
  if (v === null || typeof v !== 'object') { return JSON.stringify(v); }
  if (Array.isArray(v)) { return '[' + v.map(canonicalize).join(',') + ']'; }
  return '{' + Object.keys(v).sort().map(function (k) {
    return JSON.stringify(k) + ':' + canonicalize(v[k]);
  }).join(',') + '}';
}

/* Receipt v1.0. Hash is SHA-256 over canonical JSON with the
   provenance.report_hash_sha256 field stripped, so the hash never
   influences itself. First receipt chains from GENESIS. */
async function receiptHash(receipt) {
  var copy = JSON.parse(JSON.stringify(receipt));
  if (copy.provenance) { delete copy.provenance.report_hash_sha256; }
  return sha256Hex(canonicalize(copy));
}

async function buildReceipt(id, kind, detail, prevHash, created) {
  var r = {
    created: created,
    detail: detail,
    format: 'receipt-v1.0',
    id: id,
    kind: kind,
    prev_receipt_hash: prevHash,
    provenance: { report_hash_sha256: '' }
  };
  r.provenance.report_hash_sha256 = await receiptHash(r);
  return r;
}

async function verifyReceipt(receipt, prevHash) {
  var recomputed = await receiptHash(receipt);
  var hashOk = (recomputed === receipt.provenance.report_hash_sha256);
  var linkOk = (receipt.prev_receipt_hash === prevHash);
  return { hash_ok: hashOk, link_ok: linkOk, pass: hashOk && linkOk, recomputed: recomputed };
}
/* END RECEIPT LOGIC */

/* Sourced spoke list. AI-FW-018 names these six systems under "Applied
   across". The single-function label per spoke is a builder label (mine),
   derived from the system name only; the source states each spoke has a
   single function but does not name the function per system. */
var SPOKES = [
  { id: 'dispatch-iq', name: 'DISPATCH-IQ', func: 'dispatch routing', vertical: 'Dispatch' },
  { id: 'vla-arbitrage', name: 'VLA Arbitrage Engine', func: 'arbitrage scanning', vertical: 'Resale / Arbitrage' },
  { id: 'baker-hvac', name: 'Baker HVAC dispatcher', func: 'HVAC dispatch', vertical: 'HVAC / Home services' },
  { id: 'pulsar-dc', name: 'Pulsar DC', func: 'contract lead generation', vertical: 'Defense / Gov contracts' },
  { id: 'geointel', name: 'GeoIntel Command Center', func: 'geospatial intelligence', vertical: 'Geospatial' },
  { id: 'roof-ops', name: 'ROOF-OPS', func: 'roofing operations', vertical: 'Roofing / Construction' }
];

/* Sourced pattern rules, AI-FW-018, quoted in short form. */
var RULES = [
  { id: 'R1', text: 'No spoke communicates with another spoke directly. All routing through hub.' },
  { id: 'R2', text: 'Each spoke is stateless. Hub holds all session state.' },
  { id: 'R3', text: 'Failover: if a spoke fails, hub reroutes to backup spoke in under 200ms.' },
  { id: 'R4', text: 'Role-switching: hub dynamically assigns spoke roles based on task queue and capacity.' }
];

/* Sourced execution fabric stages, AI-FW-002. Architecture list first,
   then platform safety list. */
var FABRIC_STAGES = [
  'api-integrations',
  'workflow-orchestration',
  'automatic-retry',
  'state-management',
  'safety-constraints',
  'rollback'
];

/* Sourced five layers (NUOL), execution plan 31fa981d. Layer status words
   are the plan's own words (April 2026), not verified here. */
var LAYERS = [
  { id: 'L1', name: 'Truth Layer', plan_status: 'LIVE (plan claim, Apr 2026)', note: 'Registry of assets, clients, deployments, executions.' },
  { id: 'L2', name: 'Framework Layer', plan_status: 'NOW BUILDING (plan claim, Apr 2026)', note: 'AXON Gateway. SAL, PMLA, Model Router plus Adapter Interface, Permission Guard, Prompt Composer, Cost Tracker.' },
  { id: 'L3', name: 'Agent Layer', plan_status: 'IN PROGRESS (plan claim, Apr 2026)', note: 'Vertical agents. Registered in L1 and routed through L2.' },
  { id: 'L4', name: 'Revenue Layer', plan_status: 'PENDING (plan claim, Apr 2026)', note: 'Usage metering, white-label licensing, subscription tier enforcement.' },
  { id: 'L5', name: 'Command Layer', plan_status: 'LIVE (plan claim, Apr 2026)', note: 'Command dashboard showing assets, clients, revenue state.' }
];

var MAX_RETRIES = 3;
var FAILOVER_BUDGET_MS = 200;

function findSpoke(id) {
  for (var i = 0; i < SPOKES.length; i++) {
    if (SPOKES[i].id === id) { return SPOKES[i]; }
  }
  return null;
}

/* Fresh hub session state. R2: the hub holds all session state; spokes
   hold none. A task record lives here, never on a spoke. */
function newHubState() {
  return {
    tasks: {},
    taskSeq: 0,
    failedSpokes: {},
    roles: {},
    queueDepth: 0
  };
}

function nextTaskId(state) {
  state.taskSeq += 1;
  return 'mcp-task-' + ('0000' + state.taskSeq).slice(-4);
}

/* Command grammar (builder design, mine). Verbs: ROUTE, STATUS, FAILOVER,
   ASSIGN, RETRY, DIRECT. DIRECT exists only to demonstrate R1 blocking. */
var VERBS = ['ROUTE', 'STATUS', 'FAILOVER', 'ASSIGN', 'RETRY', 'DIRECT'];

function authorityClass(verb) {
  if (verb === 'STATUS' || verb === 'ROUTE') { return 'AUTO: hub routes, no extra gate'; }
  if (verb === 'FAILOVER' || verb === 'ASSIGN') { return 'HUB-DECISION: hub decision authority'; }
  if (verb === 'RETRY') { return 'GUARD: Permission Guard, retry cap ' + MAX_RETRIES; }
  if (verb === 'DIRECT') { return 'BLOCKED: R1 forbids direct spoke-to-spoke'; }
  return 'UNKNOWN';
}

function parseCommand(input) {
  var steps = [];
  var raw = (input || '').trim();
  steps.push('Step 1, tokenize: split on whitespace, ' + (raw === '' ? '0 tokens' : raw.split(/\s+/).length + ' tokens') + '.');
  if (raw === '') {
    return { ok: false, error: 'Empty command. Type a command or press a preset.', steps: steps, verb: null, args: [] };
  }
  var tokens = raw.split(/\s+/);
  var verb = tokens[0].toUpperCase();
  steps.push('Step 2, verb: first token uppercased is "' + verb + '".');
  if (VERBS.indexOf(verb) === -1) {
    return { ok: false, error: 'Unknown verb "' + verb + '". Known verbs: ' + VERBS.join(', ') + '.', steps: steps, verb: verb, args: tokens.slice(1) };
  }
  var args = tokens.slice(1);
  steps.push('Step 3, arity: verb ' + verb + ' takes ' + args.length + ' argument(s): [' + args.join(', ') + '].');
  var need = { ROUTE: 2, STATUS: 0, FAILOVER: 1, ASSIGN: 2, RETRY: 1, DIRECT: 3 };
  if (verb === 'ROUTE' && args.length < 2) {
    return { ok: false, error: 'ROUTE needs a spoke id and a task. Example: ROUTE roof-ops inspect-job-12.', steps: steps, verb: verb, args: args };
  }
  if (verb === 'FAILOVER' && args.length < 1) {
    return { ok: false, error: 'FAILOVER needs a spoke id. Example: FAILOVER baker-hvac.', steps: steps, verb: verb, args: args };
  }
  if (verb === 'ASSIGN' && args.length < 2) {
    return { ok: false, error: 'ASSIGN needs a spoke id and a role. Example: ASSIGN geointel scout.', steps: steps, verb: verb, args: args };
  }
  if (verb === 'RETRY' && args.length < 1) {
    return { ok: false, error: 'RETRY needs a task id. Example: RETRY mcp-task-0001.', steps: steps, verb: verb, args: args };
  }
  if (verb === 'DIRECT' && args.length < 3) {
    return { ok: false, error: 'DIRECT needs two spoke ids and a message. Example: DIRECT roof-ops baker-hvac hello.', steps: steps, verb: verb, args: args };
  }
  if (verb === 'STATUS' && args.length > 1) {
    return { ok: false, error: 'STATUS takes at most one argument: HUB or a spoke id.', steps: steps, verb: verb, args: args };
  }
  if ((verb === 'ROUTE' || verb === 'FAILOVER' || verb === 'ASSIGN') && !findSpoke(args[0].toLowerCase())) {
    return { ok: false, error: 'Unknown spoke "' + args[0] + '". Known spokes: ' + SPOKES.map(function (s) { return s.id; }).join(', ') + '.', steps: steps, verb: verb, args: args };
  }
  if (verb === 'DIRECT') {
    var a = findSpoke(args[0].toLowerCase());
    var b = findSpoke(args[1].toLowerCase());
    if (!a || !b) {
      return { ok: false, error: 'DIRECT needs two known spoke ids.', steps: steps, verb: verb, args: args };
    }
  }
  steps.push('Step 4, authority: ' + authorityClass(verb) + '.');
  steps.push('Step 5, dispatch: parsed command is valid. Hand to the hub executor.');
  return { ok: true, verb: verb, args: args, steps: steps, authority: authorityClass(verb), error: null };
}

/* Route a task through the hub to a spoke. Enforces R1 (everything passes
   the hub) and R2 (state is recorded on the hub, spoke stays stateless). */
function routeTask(state, spokeId, taskText) {
  var spoke = findSpoke(spokeId);
  var steps = [];
  if (!spoke) {
    return { ok: false, error: 'Unknown spoke "' + spokeId + '".', steps: steps, taskId: null };
  }
  if (state.failedSpokes[spokeId]) {
    steps.push('Hub sees spoke ' + spoke.name + ' is marked FAILED. R3 failover applies before routing.');
    return { ok: false, error: 'Spoke ' + spoke.name + ' is failed. Run FAILOVER ' + spokeId + ' first.', steps: steps, taskId: null, failover_needed: true };
  }
  var taskId = nextTaskId(state);
  steps.push('Step 1, intake: hub receives task "' + taskText + '" as ' + taskId + '.');
  steps.push('Step 2, R1: routing passes through the hub. No spoke is addressed directly.');
  steps.push('Step 3, decision authority: hub selects spoke ' + spoke.name + ' (single function: ' + spoke.func + ').');
  steps.push('Step 4, R2: hub writes the task record into hub session state. Spoke holds no state.');
  steps.push('Step 5, dispatch: hub sends the task to ' + spoke.name + '. Spoke executes its single function.');
  steps.push('Step 6, return: result returns to the hub, which records the outcome in session state.');
  state.tasks[taskId] = { id: taskId, spoke: spokeId, task: taskText, status: 'routed', retries: 0 };
  return { ok: true, taskId: taskId, spoke: spoke.name, steps: steps, error: null };
}

/* R1 enforcement: a direct spoke-to-spoke attempt is refused by the hub. */
function directAttempt(fromId, toId, message) {
  var from = findSpoke(fromId);
  var to = findSpoke(toId);
  var steps = [
    'Step 1, attempt: spoke ' + (from ? from.name : fromId) + ' tries to send "' + message + '" straight to spoke ' + (to ? to.name : toId) + '.',
    'Step 2, R1 check: no spoke communicates with another spoke directly.',
    'Step 3, hub intervenes: the direct message is BLOCKED. The hub offers the legal path instead.',
    'Step 4, legal path: ' + (from ? from.name : fromId) + ' sends to the HUB, the hub routes to ' + (to ? to.name : toId) + '.'
  ];
  return { ok: false, blocked: true, rule: 'R1', steps: steps, reroute: 'ROUTE ' + toId + ' ' + message };
}

/* R3 failover. The standby twin is a builder design (mine): the source
   states the hub reroutes to a backup spoke in under 200ms but does not
   name the backups. Simulated elapsed time is computed from queue depth,
   deterministic, and labeled simulated on the page. */
function failover(state, spokeId) {
  var spoke = findSpoke(spokeId);
  var steps = [];
  if (!spoke) {
    return { ok: false, error: 'Unknown spoke "' + spokeId + '".', steps: steps };
  }
  var standby = spoke.name + '-B (standby twin)';
  var simulatedMs = 40 + (state.queueDepth * 10);
  if (simulatedMs >= FAILOVER_BUDGET_MS) { simulatedMs = FAILOVER_BUDGET_MS - 1; }
  steps.push('Step 1, fault: spoke ' + spoke.name + ' reports failure. Hub marks it FAILED.');
  steps.push('Step 2, R3: hub reroutes to backup spoke ' + standby + '.');
  steps.push('Step 3, budget: reroute must complete in under ' + FAILOVER_BUDGET_MS + 'ms. Simulated elapsed: ' + simulatedMs + 'ms (simulated, not measured).');
  steps.push('Step 4, state: hub session state is untouched by the failure. R2 holds, the standby resumes from hub state.');
  steps.push('Step 5, result: ' + standby + ' is now the live spoke for function "' + spoke.func + '".');
  state.failedSpokes[spokeId] = true;
  state.roles[spokeId] = 'failed, covered by standby twin';
  return { ok: true, spoke: spoke.name, standby: standby, simulated_ms: simulatedMs, budget_ms: FAILOVER_BUDGET_MS, within_budget: simulatedMs < FAILOVER_BUDGET_MS, steps: steps };
}

/* R4 role-switching. Hub assigns a spoke role from queue depth and
   capacity. The decision rule is a builder design (mine): the source
   states the hub assigns roles based on task queue and capacity but gives
   no rule. */
function assignRole(state, spokeId, role, queueDepth, capacity) {
  var spoke = findSpoke(spokeId);
  var steps = [];
  if (!spoke) {
    return { ok: false, error: 'Unknown spoke "' + spokeId + '".', steps: steps };
  }
  if (typeof queueDepth !== 'number' || isNaN(queueDepth) || queueDepth < 0 || Math.floor(queueDepth) !== queueDepth) {
    return { ok: false, error: 'Queue depth must be a non-negative integer.', steps: steps };
  }
  if (typeof capacity !== 'number' || isNaN(capacity) || capacity < 1 || Math.floor(capacity) !== capacity) {
    return { ok: false, error: 'Capacity must be a positive integer.', steps: steps };
  }
  var load = queueDepth / capacity;
  steps.push('Step 1, inputs: queue depth ' + queueDepth + ', capacity ' + capacity + ', load ' + load.toFixed(2) + '.');
  var decision;
  if (load > 1) {
    decision = 'OVERLOAD: queue exceeds capacity. Hub assigns role "' + role + '" to ' + spoke.name + ' and flags a second spoke for the same role.';
  } else if (load >= 0.5) {
    decision = 'BUSY: load at or above half capacity. Hub assigns role "' + role + '" to ' + spoke.name + '.';
  } else {
    decision = 'IDLE: load below half capacity. Hub assigns role "' + role + '" to ' + spoke.name + ' and holds the rest of capacity in reserve.';
  }
  steps.push('Step 2, R4 decision: ' + decision);
  steps.push('Step 3, record: hub writes the role assignment into session state. Spoke holds no state (R2).');
  state.roles[spokeId] = role;
  state.queueDepth = queueDepth;
  return { ok: true, spoke: spoke.name, role: role, load: load, decision: decision, steps: steps };
}

/* Execution fabric walkthrough, AI-FW-002. Stages in source order:
   API integrations, workflow orchestration, automatic retry, state
   management, with safety constraints and rollback as the platform safety
   list. failAt names a stage to fail, or null for a clean run. Retry cap
   is MAX_RETRIES. */
function runFabric(state, taskText, failAt) {
  var steps = [];
  var taskId = nextTaskId(state);
  steps.push('Task ' + taskId + ': "' + taskText + '" enters the execution fabric.');
  var failed = false;
  var retries = 0;
  var rolledBack = false;
  for (var i = 0; i < FABRIC_STAGES.length; i++) {
    var stage = FABRIC_STAGES[i];
    if (failAt === stage) {
      failed = true;
      steps.push('Stage ' + (i + 1) + ' of ' + FABRIC_STAGES.length + ', ' + stage + ': FAILED (injected failure).');
      if (stage === 'automatic-retry') {
        steps.push('Retry logic is itself the failed stage. No retry is possible. Rollback starts.');
      } else {
        steps.push('Safety constraints hold the failure inside the fabric. Automatic retry begins, cap ' + MAX_RETRIES + '.');
        for (var r = 1; r <= MAX_RETRIES; r++) {
          retries = r;
          steps.push('Retry ' + r + ' of ' + MAX_RETRIES + ' at stage ' + stage + ': still failing (injected failure persists).');
        }
        steps.push('Retry cap reached. Rollback starts: the fabric undoes the completed stages in reverse order.');
      }
      var done = FABRIC_STAGES.slice(0, i).reverse();
      done.forEach(function (s) { steps.push('Rollback: undo ' + s + '.'); });
      rolledBack = true;
      steps.push('Rollback complete. Task ' + taskId + ' ends FAILED, safely, with state consistent.');
      break;
    }
    steps.push('Stage ' + (i + 1) + ' of ' + FABRIC_STAGES.length + ', ' + stage + ': OK.');
  }
  if (!failed) {
    steps.push('All ' + FABRIC_STAGES.length + ' stages pass. Task ' + taskId + ' ends COMPLETE. Hub records the outcome.');
  }
  state.tasks[taskId] = { id: taskId, spoke: 'fabric', task: taskText, status: failed ? 'failed-rolled-back' : 'complete', retries: retries };
  return { ok: !failed, taskId: taskId, steps: steps, retries: retries, rolled_back: rolledBack, failed_stage: failed ? failAt : null };
}

/* Retry a task, capped at MAX_RETRIES. */
function retryTask(state, taskId) {
  var steps = [];
  var t = state.tasks[taskId];
  if (!t) {
    return { ok: false, error: 'Unknown task "' + taskId + '". No task record in hub session state.', steps: steps };
  }
  if (t.status === 'complete') {
    return { ok: false, error: 'Task ' + taskId + ' already completed. Nothing to retry.', steps: steps };
  }
  if (t.retries >= MAX_RETRIES) {
    steps.push('Task ' + taskId + ' has used ' + t.retries + ' of ' + MAX_RETRIES + ' retries. Cap reached. Rollback is the next step, not another retry.');
    return { ok: false, error: 'Retry cap ' + MAX_RETRIES + ' reached for ' + taskId + '.', steps: steps, cap_reached: true };
  }
  t.retries += 1;
  steps.push('Retry ' + t.retries + ' of ' + MAX_RETRIES + ' for task ' + taskId + ' (spoke: ' + t.spoke + '). Hub re-sends through the normal route.');
  if (t.status === 'failed-rolled-back') {
    t.status = 'retried-after-rollback';
    steps.push('Task was rolled back earlier. The hub replays it from the recorded hub state (R2), not from spoke memory.');
  } else {
    t.status = 'retried';
  }
  return { ok: true, taskId: taskId, retries: t.retries, steps: steps };
}

function hubStatus(state, target) {
  var steps = [];
  if (!target || target.toUpperCase() === 'HUB') {
    var taskCount = Object.keys(state.tasks).length;
    var failed = Object.keys(state.failedSpokes).length;
    steps.push('HUB status: ' + taskCount + ' task(s) in hub session state, ' + failed + ' failed spoke(s), ' + SPOKES.length + ' spokes registered.');
    steps.push('R2: all session state lives on the hub. Spokes hold none.');
    return { ok: true, target: 'HUB', tasks: taskCount, failed_spokes: failed, spokes: SPOKES.length, steps: steps };
  }
  var spoke = findSpoke(target.toLowerCase());
  if (!spoke) {
    return { ok: false, error: 'Unknown spoke "' + target + '".', steps: steps };
  }
  var role = state.roles[spoke.id] || 'default role: ' + spoke.func;
  var failedFlag = !!state.failedSpokes[spoke.id];
  steps.push('Spoke ' + spoke.name + ': function "' + spoke.func + '", vertical "' + spoke.vertical + '".');
  steps.push('State: ' + (failedFlag ? 'FAILED (covered by standby twin)' : 'LIVE') + '. Role: ' + role + '.');
  steps.push('R2: spoke holds no session state. Ask the hub for task records.');
  return { ok: true, target: spoke.name, role: role, failed: failedFlag, steps: steps };
}

/* Execute a parsed command against hub state. Returns a result object
   with human-readable steps for the page. */
function executeParsed(state, parsed) {
  if (!parsed.ok) { return { ok: false, error: parsed.error, steps: parsed.steps }; }
  var steps = parsed.steps.slice();
  var v = parsed.verb;
  var a = parsed.args;
  var r;
  if (v === 'ROUTE') {
    r = routeTask(state, a[0].toLowerCase(), a.slice(1).join(' '));
    r.steps = steps.concat(r.steps);
    return r;
  }
  if (v === 'STATUS') {
    r = hubStatus(state, a[0]);
    r.steps = steps.concat(r.steps);
    return r;
  }
  if (v === 'FAILOVER') {
    r = failover(state, a[0].toLowerCase());
    r.steps = steps.concat(r.steps);
    return r;
  }
  if (v === 'ASSIGN') {
    /* Command-line ASSIGN has no queue or capacity arguments, so it uses
       the hub's current queue depth and a builder default capacity of 4.
       The role-switching panel takes explicit values. */
    r = assignRole(state, a[0].toLowerCase(), a[1], state.queueDepth, 4);
    r.steps = steps.concat(r.steps);
    return r;
  }
  if (v === 'RETRY') {
    r = retryTask(state, a[0]);
    r.steps = steps.concat(r.steps);
    return r;
  }
  if (v === 'DIRECT') {
    r = directAttempt(a[0].toLowerCase(), a[1].toLowerCase(), a.slice(2).join(' '));
    r.steps = steps.concat(r.steps);
    return r;
  }
  return { ok: false, error: 'Unhandled verb ' + v + '.', steps: steps };
}

var PRESETS = {
  route: 'ROUTE roof-ops inspect-job-12',
  direct: 'DIRECT roof-ops baker-hvac handover-job-12',
  failover: 'FAILOVER baker-hvac',
  status: 'STATUS HUB',
  retry: 'RETRY mcp-task-0001'
};
/* END PURE LOGIC */

/* Page wiring. Runs only in a browser. */
if (typeof document !== 'undefined') {
  var hub = newHubState();
  var receipts = [];
  var receiptSeq = 0;

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function stepsHtml(steps) {
    return '<ol>' + steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>';
  }

  async function emitReceipt(kind, detail) {
    receiptSeq += 1;
    var id = 'mcp-20261114-' + ('0000' + receiptSeq).slice(-4);
    var prevHash = receipts.length === 0 ? 'GENESIS' : receipts[receipts.length - 1].provenance.report_hash_sha256;
    var created = new Date().toISOString();
    var receipt = await buildReceipt(id, kind, detail, prevHash, created);
    receipts.push(receipt);
    renderReceipts();
    return receipt;
  }

  function renderReceipts() {
    var host = $('receipt-list');
    if (!host) { return; }
    if (receipts.length === 0) {
      host.innerHTML = '<p class="muted">No receipts yet this session. Run the parser, the router, failover, role-switching, or the fabric walkthrough to emit one.</p>';
      return;
    }
    var html = '';
    receipts.forEach(function (r, idx) {
      html += '<div class="rcard"><p><strong>' + esc(r.id) + '</strong> ' + esc(r.kind) + ' <span class="muted">' + esc(r.created) + '</span></p>'
        + '<p>Hash: <code>' + esc(r.provenance.report_hash_sha256) + '</code></p>'
        + '<p>Prev hash: <code>' + esc(r.prev_receipt_hash) + '</code></p>'
        + '<p>Detail: <code>' + esc(JSON.stringify(r.detail)) + '</code></p>'
        + '<p>Verify: <span id="verify-' + idx + '" class="muted">not checked yet</span></p>'
        + '<details><summary>Raw receipt JSON</summary><pre>' + esc(JSON.stringify(r, null, 2)) + '</pre></details></div>';
    });
    host.innerHTML = html;
  }

  async function verifyAll() {
    var out = $('verify-output');
    if (receipts.length === 0) {
      out.innerHTML = '<p class="muted">No receipts to verify yet.</p>';
      return;
    }
    var allPass = true;
    for (var i = 0; i < receipts.length; i++) {
      var prev = i === 0 ? 'GENESIS' : receipts[i - 1].provenance.report_hash_sha256;
      var v = await verifyReceipt(receipts[i], prev);
      var el = $('verify-' + i);
      if (el) {
        el.textContent = v.pass ? 'PASS' : 'FAIL';
        el.className = v.pass ? 'verdict pass' : 'verdict fail';
      }
      if (!v.pass) { allPass = false; }
    }
    out.innerHTML = allPass
      ? '<p class="pass">CHAIN PASS: ' + receipts.length + ' receipt(s), every hash recomputed and every link checked.</p>'
      : '<p class="fail">CHAIN FAIL: at least one receipt hash or link did not verify. See the per-receipt verdicts.</p>';
  }

  function runCommand() {
    var input = $('cmd-input').value;
    var parsed = parseCommand(input);
    var out = $('cmd-output');
    var result = executeParsed(hub, parsed);
    var html = stepsHtml(result.steps);
    if (result.ok) {
      html = '<p class="pass">OK: ' + esc(parsed.verb) + ' accepted by the hub.</p>' + html;
      emitReceipt('command-' + parsed.verb.toLowerCase(), { command: input, verb: parsed.verb, args: parsed.args });
    } else {
      html = '<p class="fail">REJECTED: ' + esc(result.error || parsed.error || 'parse failed') + '</p>' + html;
      if (parsed.verb === 'DIRECT') {
        html += '<p>Legal path instead: <code>' + esc(result.reroute || '') + '</code></p>';
        emitReceipt('command-direct-blocked', { command: input, rule: 'R1', reroute: result.reroute });
      }
    }
    out.innerHTML = html;
  }

  function runRoute() {
    var spokeId = $('route-spoke').value;
    var task = $('route-task').value.trim() || 'sample-task';
    var r = routeTask(hub, spokeId, task);
    var html = stepsHtml(r.steps);
    if (r.ok) {
      $('route-output').innerHTML = '<p class="pass">Routed: ' + esc(r.taskId) + ' to ' + esc(r.spoke) + '.</p>' + html;
      emitReceipt('route', { task_id: r.taskId, spoke: spokeId, task: task });
    } else {
      $('route-output').innerHTML = '<p class="fail">Not routed: ' + esc(r.error) + '</p>' + html;
      if (r.failover_needed) {
        $('route-output').innerHTML += '<p>Run FAILOVER ' + esc(spokeId) + ' in the failover panel first.</p>';
      }
    }
  }

  function runDirect() {
    var a = $('direct-a').value;
    var b = $('direct-b').value;
    var msg = $('direct-msg').value.trim() || 'hello';
    var r = directAttempt(a, b, msg);
    $('direct-output').innerHTML = '<p class="fail">BLOCKED by R1: direct spoke-to-spoke is refused.</p>' + stepsHtml(r.steps)
      + '<p>Legal path instead: <code>' + esc(r.reroute) + '</code></p>';
    emitReceipt('direct-blocked', { from: a, to: b, rule: 'R1', reroute: r.reroute });
  }

  function runFailover() {
    var spokeId = $('failover-spoke').value;
    var r = failover(hub, spokeId);
    if (r.ok) {
      $('failover-output').innerHTML = '<p class="pass">Failover complete: ' + esc(r.standby) + ' live in simulated ' + r.simulated_ms + 'ms, inside the under-200ms budget.</p>' + stepsHtml(r.steps);
      emitReceipt('failover', { spoke: spokeId, standby: r.standby, simulated_ms: r.simulated_ms, budget_ms: r.budget_ms });
    } else {
      $('failover-output').innerHTML = '<p class="fail">' + esc(r.error) + '</p>' + stepsHtml(r.steps);
    }
  }

  function runAssign() {
    var spokeId = $('assign-spoke').value;
    var role = $('assign-role').value.trim() || 'scout';
    var q = parseInt($('assign-queue').value, 10);
    var cap = parseInt($('assign-cap').value, 10);
    var r = assignRole(hub, spokeId, role, q, cap);
    if (r.ok) {
      $('assign-output').innerHTML = '<p class="pass">' + esc(r.decision) + '</p>' + stepsHtml(r.steps);
      emitReceipt('role-assign', { spoke: spokeId, role: role, queue_depth: q, capacity: cap, load: r.load });
    } else {
      $('assign-output').innerHTML = '<p class="fail">' + esc(r.error) + '</p>' + stepsHtml(r.steps);
    }
  }

  function runFabric() {
    var task = $('fabric-task').value.trim() || 'sample-fabric-task';
    var failAt = $('fabric-fail').value || null;
    if (failAt === 'none') { failAt = null; }
    var r = runFabric(hub, task, failAt);
    var head = r.ok
      ? '<p class="pass">Fabric run COMPLETE for ' + esc(r.taskId) + '.</p>'
      : '<p class="fail">Fabric run FAILED at stage "' + esc(r.failed_stage) + '" for ' + esc(r.taskId) + ', rolled back safely. Retries used: ' + r.retries + '.</p>';
    $('fabric-output').innerHTML = head + stepsHtml(r.steps);
    emitReceipt('fabric-run', { task_id: r.taskId, task: task, failed_stage: r.failed_stage, retries: r.retries, rolled_back: r.rolled_back });
  }

  function runHubStatus() {
    var target = $('status-target').value;
    var r = hubStatus(hub, target);
    if (r.ok) {
      $('status-output').innerHTML = '<p class="pass">Status OK.</p>' + stepsHtml(r.steps);
    } else {
      $('status-output').innerHTML = '<p class="fail">' + esc(r.error) + '</p>';
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderReceipts();
    $('run-cmd').addEventListener('click', runCommand);
    $('preset-route').addEventListener('click', function () { $('cmd-input').value = PRESETS.route; runCommand(); });
    $('preset-direct').addEventListener('click', function () { $('cmd-input').value = PRESETS.direct; runCommand(); });
    $('preset-failover').addEventListener('click', function () { $('cmd-input').value = PRESETS.failover; runCommand(); });
    $('preset-status').addEventListener('click', function () { $('cmd-input').value = PRESETS.status; runCommand(); });
    $('run-route').addEventListener('click', runRoute);
    $('run-direct').addEventListener('click', runDirect);
    $('run-failover').addEventListener('click', runFailover);
    $('run-assign').addEventListener('click', runAssign);
    $('run-fabric').addEventListener('click', runFabric);
    $('run-status').addEventListener('click', runHubStatus);
    $('verify-all').addEventListener('click', verifyAll);
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FAILOVER_BUDGET_MS: FAILOVER_BUDGET_MS,
    FABRIC_STAGES: FABRIC_STAGES,
    LAYERS: LAYERS,
    MAX_RETRIES: MAX_RETRIES,
    PRESETS: PRESETS,
    RULES: RULES,
    SPOKES: SPOKES,
    VERBS: VERBS,
    assignRole: assignRole,
    authorityClass: authorityClass,
    buildReceipt: buildReceipt,
    canonicalize: canonicalize,
    directAttempt: directAttempt,
    executeParsed: executeParsed,
    failover: failover,
    findSpoke: findSpoke,
    hubStatus: hubStatus,
    newHubState: newHubState,
    parseCommand: parseCommand,
    receiptHash: receiptHash,
    retryTask: retryTask,
    routeTask: routeTask,
    runFabric: runFabric,
    sha256Hex: sha256Hex,
    verifyReceipt: verifyReceipt
  };
}
