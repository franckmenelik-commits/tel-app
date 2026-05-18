#!/bin/bash
# TEL — Sovereign Nightly Ingestion
# This script runs every night to feed TEL's memory with fresh data
# from Reddit's most intellectually valuable communities.

LOG_DIR="$HOME/Desktop/Projets/tel-app/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/ingest-$(date +%Y-%m-%d).log"

echo "═══════════════════════════════════════" >> "$LOG_FILE"
echo "TEL Nightly Ingestion — $(date)" >> "$LOG_FILE"
echo "═══════════════════════════════════════" >> "$LOG_FILE"

# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 22 >> "$LOG_FILE" 2>&1

cd "$HOME/Desktop/Projets/tel-app"

# Run the batch ingestion (5 posts per subreddit)
npx tsx scripts/ingest_daemon.ts reddit-batch 5 >> "$LOG_FILE" 2>&1

# Also grab top HackerNews stories
for id in $(curl -s 'https://hacker-news.firebaseio.com/v0/topstories.json' | python3 -c "import sys,json; [print(x) for x in json.load(sys.stdin)[:3]]" 2>/dev/null); do
  npx tsx scripts/ingest_daemon.ts hackernews "$id" >> "$LOG_FILE" 2>&1
done

echo "" >> "$LOG_FILE"
echo "✅ Nightly ingestion complete at $(date)" >> "$LOG_FILE"
echo "═══════════════════════════════════════" >> "$LOG_FILE"
