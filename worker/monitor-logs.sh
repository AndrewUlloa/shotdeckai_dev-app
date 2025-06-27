#!/bin/bash

# ShotDeckAI Multi-Tier System Log Monitor
# Usage: ./monitor-logs.sh [environment]

ENVIRONMENT=${1:-dev}

echo "🚀 Starting ShotDeckAI Multi-Tier Log Monitor"
echo "📊 Environment: $ENVIRONMENT"
echo "🔍 Monitoring for: INSTANT, FAST, FINAL, SEMANTIC, CACHE"
echo "⏹️  Press Ctrl+C to stop"
echo ""

# Function to add colored output for different tiers
format_logs() {
    while IFS= read -r line; do
        if [[ $line == *"[INSTANT]"* ]]; then
            echo -e "\033[93m⚡ $line\033[0m"  # Yellow for instant
        elif [[ $line == *"[FAST]"* ]]; then
            echo -e "\033[94m🚀 $line\033[0m"  # Blue for fast
        elif [[ $line == *"[FINAL]"* ]]; then
            echo -e "\033[92m✨ $line\033[0m"  # Green for final
        elif [[ $line == *"[SEMANTIC]"* ]]; then
            echo -e "\033[95m🧠 $line\033[0m"  # Purple for semantic
        elif [[ $line == *"[CACHE]"* ]]; then
            echo -e "\033[96m💾 $line\033[0m"  # Cyan for cache
        elif [[ $line == *"[MULTI-TIER]"* ]]; then
            echo -e "\033[97m🎯 $line\033[0m"  # White for multi-tier
        elif [[ $line == *"[BACKGROUND]"* ]]; then
            echo -e "\033[90m🔥 $line\033[0m"  # Gray for background
        elif [[ $line == *"ERROR"* ]] || [[ $line == *"❌"* ]]; then
            echo -e "\033[91m❌ $line\033[0m"  # Red for errors
        else
            echo "$line"
        fi
    done
}

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

# Start tailing logs with formatting
echo "📡 Connecting to Cloudflare Worker logs..."
wrangler tail --format=pretty --env=$ENVIRONMENT | format_logs

echo ""
echo "🔍 Log monitoring stopped"
echo "💡 Tip: Use 'npm run logs:dev' or 'npm run logs:prod' from package.json" 