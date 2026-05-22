#!/bin/bash
# TEL — Sentinel Daemon Routine
# Runs all health check agents and writes reports.

LOG_DIR="$HOME/Desktop/Projets/tel-app/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/sentinel-$(date +%Y-%m-%d).log"

echo "═══════════════════════════════════════" >> "$LOG_FILE"
echo "TEL Sentinel Daemon — $(date)" >> "$LOG_FILE"
echo "═══════════════════════════════════════" >> "$LOG_FILE"

# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 22 >> "$LOG_FILE" 2>&1

cd "$HOME/Desktop/Projets/tel-app"

# Run the Sentinel Daemon
npx tsx scripts/agents/sentinel_daemon.ts >> "$LOG_FILE" 2>&1

echo "" >> "$LOG_FILE"
echo "✅ Sentinel audit complete at $(date)" >> "$LOG_FILE"
echo "═══════════════════════════════════════" >> "$LOG_FILE"
