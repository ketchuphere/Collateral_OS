#!/usr/bin/env bash
# ============================================================
# codegen.sh — Regenerate all auto-generated files
# ============================================================
# Run whenever openapi.yaml is updated.
# ============================================================

set -euo pipefail
echo "🔧 Regenerating from openapi.yaml..."
pnpm --filter @collateral-os/api-spec run codegen
echo "✅ Codegen complete"
echo "  → packages/api-client-react/src/generated/  (TanStack Query hooks)"
echo "  → packages/api-zod/src/generated/           (Zod validators)"
