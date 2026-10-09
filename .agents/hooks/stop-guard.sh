#!/usr/bin/env bash
# ==============================================================================
# Stop Hook — Olympus Completion Stop-Gate (Prove-It Gatekeeper)
# ==============================================================================
# Kontrak Antigravity:
# Input: JSON pada stdin (executionNum, terminationReason, fullyIdle, dll.)
# Output: JSON pada stdout ({"decision": "allow"|"continue", "reason": "..."})
# ==============================================================================

set -euo pipefail

INPUT_JSON=$(cat)
HOOK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ "$(basename "$(dirname "$HOOK_DIR")")" == ".agents" ]]; then
    REPO_ROOT="$(cd "$HOOK_DIR/../.." && pwd)"
else
    REPO_ROOT="$(cd "$HOOK_DIR/.." && pwd)"
fi

PYTHONPATH="${REPO_ROOT}/src" python3 -c "
import json
import sys
from pathlib import Path

repo_root = Path('${REPO_ROOT}')
state_file = repo_root / '.aegis' / 'lifecycle_state.json'
if not state_file.is_file():
    state_file = repo_root / '.agents' / '.aegis' / 'lifecycle_state.json'

current_phase = 'DEFINE'
verify_passed = False

if state_file.is_file():
    try:
        data = json.loads(state_file.read_text(encoding='utf-8'))
        current_phase = data.get('current_phase', 'DEFINE')
        gates = data.get('gates', {})
        verify_passed = gates.get('verify_passed', False)
    except Exception:
        pass

# Jika agen ingin berhenti saat berada di fase BUILD dan tes belum diverifikasi
if current_phase == 'BUILD' and not verify_passed:
    output = {
        'decision': 'continue',
        'reason': 'STOP-GATE (Prove-It Pattern): Anda telah melakukan perubahan implementasi (Hephaestus) tetapi belum menjalankan tahap VERIFY (Heracles). Harap jalankan unit test hingga 100% hijau sebelum menutup tugas.'
    }
    print(json.dumps(output))
    sys.exit(0)

# Izinkan stop normal
output = {
    'decision': 'allow'
}
print(json.dumps(output))
"
