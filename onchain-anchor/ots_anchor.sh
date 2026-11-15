#!/bin/sh
# Neuruh On-Chain Anchor v2 — OpenTimestamps anchoring script (item 31, 80).
# Flow: stamp -> wait -> upgrade -> verify. Bitcoin-anchored, $0.
# THIS SCRIPT DOES NOT RUN BY ITSELF. It requires an explicit human approval
# record (item 45) and is only executed when Jeramie picks this option.
# It never touches a wallet or a private key: only the manifest's hash is
# submitted to public calendar servers.
#
# Usage (after Jeramie approves):
#   sh ots_anchor.sh manifest-v2.json
#
# Expected outputs are printed at each step. Failure modes (item 41):
#   - calendar server slow or unreachable: `ots upgrade` says "pending";
#     wait longer and retry. The .ots file is still valid.
#   - `ots verify` needs a local Bitcoin node for full verification; without
#     one, verify at https://opentimestamps.org in the browser instead.
set -eu
MANIFEST="${1:-manifest-v2.json}"
OTS_FILE="${MANIFEST}.ots"
APPROVAL="anchor-approval.txt"

if [ ! -f "$APPROVAL" ]; then
  echo "STOP: no human approval record found ($APPROVAL)."
  echo "Jeramie must create it first, e.g.:"
  echo "  echo 'approved by Jeramie Hicks on 2026-11-15: OpenTimestamps anchor of $MANIFEST' > $APPROVAL"
  exit 1
fi
echo "Approval on file: $(cat "$APPROVAL")"
command -v ots >/dev/null 2>&1 || { echo "install first: pip install opentimestamps-client"; exit 1; }

echo "--- step 1: stamp (creates $OTS_FILE, pending proof) ---"
ots stamp "$MANIFEST"
echo "expected: a file $OTS_FILE now exists; it is PENDING, not yet anchored."
ls -la "$OTS_FILE"

echo "--- step 2: wait ---"
echo "Wait a few hours for the calendar servers to anchor the hash into Bitcoin."
echo "Then run: ots upgrade $OTS_FILE"

echo "--- step 3 (after waiting): upgrade ---"
echo "Run: ots upgrade $OTS_FILE"
echo "expected: the .ots file is updated with the Bitcoin attestation (block height + tx)."

echo "--- step 4: verify ---"
echo "Run: ots verify $OTS_FILE"
echo "expected: 'Success! Bitcoin attests ...' (CLI verify needs a local Bitcoin node;"
echo "otherwise verify at https://opentimestamps.org by uploading the .ots file)."
echo "--- after verification: run python3 post_anchor_update.py --ots $OTS_FILE ---"
