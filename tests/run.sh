#!/usr/bin/env bash
# TowerLords test suite. Requires node. Usage:  bash tests/run.sh
set -e
cd "$(dirname "$0")/.."
node tests/extract.js
node --check tests/.build/towerlords.js && echo "syntax: OK"
echo; node tests/unit.js        tests/.build/towerlords.js
echo; node tests/integration.js tests/.build/towerlords.js
