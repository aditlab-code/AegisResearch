#!/usr/bin/env bash
# ==============================================================================
# PreToolUse Hook — Olympus Strict Stop-Gate & Guardfile Protection
# ==============================================================================
# Kontrak Antigravity:
# Input: JSON pada stdin (toolCall: {name, args}, stepIdx, dll.)
# Output: JSON pada stdout ({"decision": "allow"|"deny", "reason": "..."})
# ==============================================================================

set -euo pipefail

# Baca stdin
INPUT_JSON=$(cat)

# Dapatkan direktori root repositori
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

raw_input = '''${INPUT_JSON}'''
try:
    payload = json.loads(raw_input)
except Exception:
    payload = {}

repo_root = Path('${REPO_ROOT}')
state_file = repo_root / '.aegis' / 'lifecycle_state.json'
if not state_file.is_file():
    state_file = repo_root / '.agents' / '.aegis' / 'lifecycle_state.json'

current_phase = 'DEFINE'
if state_file.is_file():
    try:
        data = json.loads(state_file.read_text(encoding='utf-8'))
        current_phase = data.get('current_phase', 'DEFINE')
    except Exception:
        pass

tool_call = payload.get('toolCall', {})
tool_name = str(tool_call.get('name', '')).strip()
args = tool_call.get('args', {})

# Ekstrak target path jika tool menulis berkas
target_file = args.get('TargetFile') or args.get('path') or args.get('file_path') or ''
target_lower = str(target_file).lower()

# 1. Guardfile Protection untuk berkas database dan environment sensitif
protected_patterns = ['.sqlite', '.db', 'production.env', '.env.local']
for pat in protected_patterns:
    if pat in target_lower:
        output = {
            'decision': 'deny',
            'reason': f'STOP-GATE PROTEKSI: Berkas database/konfigurasi sensitif ({target_file}) dilindungi dari modifikasi langsung.'
        }
        print(json.dumps(output))
        sys.exit(0)

# 2. Stop-Gate Tahap DEFINE & PLAN
# Pada tahap DEFINE / PLAN, dilarang menulis berkas kode produksi sebelum SPEC selesai
if current_phase in ('DEFINE', 'PLAN'):
    if tool_name in ('write_to_file', 'replace_file_content', 'write_file', 'edit_file'):
        allowed_docs = ['spec.md', 'prd.md', 'plan.md', 'todo.md', 'requirements.md', '.agents', 'agents', 'skills', 'hooks', 'commands']
        is_doc = any(doc in target_lower for doc in allowed_docs)
        if not is_doc and (target_lower.endswith('.py') or target_lower.endswith('.ts') or target_lower.endswith('.js') or target_lower.endswith('.go')):
            output = {
                'decision': 'deny',
                'reason': f'STOP-GATE TAHAPAN {current_phase}: Anda sedang berada pada tahap perumusan spesifikasi/rencana (Athena). Dilarang memodifikasi berkas kode ({target_file}) sebelum spesifikasi selesai dirumuskan.'
            }
            print(json.dumps(output))
            sys.exit(0)

# Default: Izinkan eksekusi tool
output = {
    'decision': 'allow'
}
print(json.dumps(output))
"
