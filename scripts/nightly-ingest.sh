#!/bin/bash
# TEL — Sovereign Nightly World Ingestion
# "Babel a dispersé les langages. TEL rassemble les vécus."
#
# This script runs every night to feed TEL's memory with fresh perspectives
# from EVERY continent — not just the Western anglosphere.
#
# Sources:
#   🌍 Reddit (8 subreddits: philosophy, history, debate, geopolitics...)
#   🌍 Global Voices (Afrique, Asie, Moyen-Orient, Amérique Latine, Autochtones)
#   🌍 AllAfrica (Afrique panafricaine)
#   🇮🇳 The Wire India, Scroll.in (Inde)
#   🌍 Al Jazeera (Moyen-Orient)
#   🌏 SCMP (Asie-Est)
#   💻 HackerNews (top 3 stories)

LOG_DIR="$HOME/Desktop/Projets/tel-app/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/ingest-$(date +%Y-%m-%d).log"

echo "═══════════════════════════════════════" >> "$LOG_FILE"
echo "TEL World Ingestion — $(date)" >> "$LOG_FILE"
echo "═══════════════════════════════════════" >> "$LOG_FILE"

# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 22 >> "$LOG_FILE" 2>&1

cd "$HOME/Desktop/Projets/tel-app"

# Run the FULL WORLD batch ingestion (Reddit + Global South + HN)
npx tsx scripts/ingest_daemon.ts world-batch 5 >> "$LOG_FILE" 2>&1

echo "" >> "$LOG_FILE"
echo "✅ World ingestion complete at $(date)" >> "$LOG_FILE"
echo "═══════════════════════════════════════" >> "$LOG_FILE"
