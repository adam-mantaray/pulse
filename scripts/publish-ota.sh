#!/bin/bash
# Usage: ./scripts/publish-ota.sh "Phase B — Sub-task delegation + agent flow"
set -e

MESSAGE="${1:-OTA update}"

echo "📦 Publishing OTA: $MESSAGE"
cd "$(dirname "$0")/.."

eas update \
  --channel production \
  --message "$MESSAGE" \
  --non-interactive

echo "✅ OTA published"
