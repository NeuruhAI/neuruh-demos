(function (root) {
  "use strict";
  const LEDGER_SLOT = "neuruh_os_ledger_v11";
  const ANCHOR_V2_ROOT = "afd56cea3e4abe9265f83c3552cddebac2771ab6d5d50012a641695fd8b8777f";
  const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("neuruh-os-bus") : null;

  function canonicalJSON(val) {
    if (val === null || typeof val !== "object") return JSON.stringify(val);
    if (Array.isArray(val)) return "[" + val.map(canonicalJSON).join(",") + "]";
    const keys = Object.keys(val).sort();
    return "{" + keys.map(k => JSON.stringify(k) + ":" + canonicalJSON(val[k])).join(",") + "}";
  }

  async function sha256Hex(str) {
    const buf = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
  }

  function getChain() {
    try { return JSON.parse(localStorage.getItem(LEDGER_SLOT) || "[]"); }
    catch { return []; }
  }

  function saveChain(chain) {
    localStorage.setItem(LEDGER_SLOT, JSON.stringify(chain));
  }

  async function emit(action, actor, payload) {
    const chain = getChain();
    const prev_hash = chain.length ? chain[chain.length - 1].receipt_hash : "GENESIS";
    const body = {
      receipt_version: "1.1",
      prev_hash,
      action,
      actor,
      timestamp: new Date().toISOString(),
      merkle_root: ANCHOR_V2_ROOT,
      anchor_root: null,
      payload
    };
    const receipt_hash = await sha256Hex(canonicalJSON(body));
    const receipt = Object.assign({ receipt_id: receipt_hash, receipt_hash }, body);
    chain.push(receipt);
    saveChain(chain);
    if (channel) channel.postMessage({ type: "RECEIPT_APPENDED", receipt });
    return receipt;
  }

  async function verifyChain() {
    const chain = getChain();
    let expectedPrev = "GENESIS";
    for (let i = 0; i < chain.length; i++) {
      const r = chain[i];
      if (r.prev_hash !== expectedPrev) return { ok: false, failedAt: i, reason: "prev_hash mismatch" };
      const copy = {};
      Object.keys(r).forEach(k => { if (k !== "receipt_hash" && k !== "receipt_id") copy[k] = r[k]; });
      const recomputed = await sha256Hex(canonicalJSON(copy));
      if (recomputed !== r.receipt_hash || r.receipt_id !== r.receipt_hash) {
        return { ok: false, failedAt: i, reason: "hash mismatch" };
      }
      expectedPrev = r.receipt_hash;
    }
    return { ok: true, count: chain.length };
  }

  function clearChain() {
    localStorage.removeItem(LEDGER_SLOT);
    if (channel) channel.postMessage({ type: "CHAIN_CLEARED" });
  }

  root.NeuruhBus = { emit, getChain, verifyChain, clearChain, channel, canonicalJSON };
})(typeof window !== "undefined" ? window : globalThis);
