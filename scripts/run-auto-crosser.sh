#!/bin/bash
# TEL — Sovereign Auto-Crosser Routine
# Automatically runs SOUFFLE crossing on top HackerNews items to feed the homepage.

LOG_DIR="$HOME/Desktop/Projets/tel-app/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/crosser-$(date +%Y-%m-%d).log"

echo "═══════════════════════════════════════" >> "$LOG_FILE"
echo "TEL Auto-Crosser — $(date)" >> "$LOG_FILE"
echo "═══════════════════════════════════════" >> "$LOG_FILE"

# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 22 >> "$LOG_FILE" 2>&1

cd "$HOME/Desktop/Projets/tel-app"

# Run the Auto-Crosser
npx tsx scripts/auto_crosser.ts >> "$LOG_FILE" 2>&1

echo "" >> "$LOG_FILE"
echo "✅ Auto-crossing complete at $(date)" >> "$LOG_FILE"
echo "═══════════════════════════════════════" >> "$LOG_FILE"
