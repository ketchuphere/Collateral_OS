set -euo pipefail

echo "🚀 Setting up CollateralOS development environment..."

#1. Check prerequisites
command -v node >/dev/null 2>&1 || { echo " Node.js 24+ required"; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo " pnpm required: npm install -g pnpm"; exit 1; }

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo " Node.js 20+ required (found v$NODE_VERSION)"
  exit 1
fi

#2. Install dependencies
echo "   Installing workspace dependencies..."
pnpm install

#3. Check for .env
if [ ! -f ".env" ]; then
  echo "   Creating .env from template..."
  cp configs/env.example .env
  echo "  ⚠️  Edit .env and set DATABASE_URL and GROQ_API_KEY before continuing"
  exit 0
fi

#4. Push database schema
echo "  → Pushing database schema..."
pnpm db:push

#5. Regenerate API client
echo "   Regenerating API client..."
pnpm codegen

echo ""
echo " Setup complete!"
echo ""
echo "Start the development servers:"
echo "  Terminal 1: pnpm dev:backend"
echo "  Terminal 2: pnpm dev:frontend"
echo ""
echo "Optional: seed the database with demo data:"
echo "  pnpm tsx data/seed.ts"
