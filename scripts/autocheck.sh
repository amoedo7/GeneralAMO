#!/usr/bin/env bash
set -euo pipefail

python - <<'PY'
import json
from pathlib import Path

contract = json.loads(Path('.amo').read_text(encoding='utf-8'))
assert contract.get('schema') == 'desarrollamo.amo.v1'
assert contract.get('id') == 'generalamo'
checks = contract.get('health', {}).get('checks', [])
assert checks, 'GeneralAMO contract must declare at least one health check'
assert checks[0].get('command') == 'bash scripts/autocheck.sh'
assert contract.get('policy', {}).get('self_declared_pass_allowed') is False
print('GENERALAMO_CONTRACT_OK')
PY

python scripts/validate_mvp.py
