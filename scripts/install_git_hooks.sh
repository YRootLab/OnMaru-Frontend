#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOOKS_DIR="$ROOT_DIR/.githooks"

if [[ ! -d "$HOOKS_DIR" ]]; then
  echo "Missing hooks directory: $HOOKS_DIR" >&2
  exit 1
fi

chmod +x "$HOOKS_DIR"/*
git -C "$ROOT_DIR" config core.hooksPath .githooks

echo "Installed git hooks: core.hooksPath -> .githooks"
echo "pre-push now refuses direct pushes to main, develop, and release/*."
echo "Bypass intentionally with: ALLOW_DIRECT_PUSH=1 git push ..."
