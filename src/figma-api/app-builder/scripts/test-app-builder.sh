#!/bin/bash

##
# App Builder Test Script
# 
# Tests the app-builder endpoint by sending a fullAppConfig.json file
# 
# Usage: npm run test:app-builder [path-to-fullAppConfig.json]
##

set -e

# Default config file path
DEFAULT_CONFIG="figma-exports/myAppTest/fullAppConfig2.json"
CONFIG_FILE="${1:-$DEFAULT_CONFIG}"

# Output directory for generated apps
OUTPUT_DIR="figma-exports/generated-apps"

# Check if file exists
if [ ! -f "$CONFIG_FILE" ]; then
  echo "❌ Error: Config file not found: $CONFIG_FILE"
  exit 1
fi

echo "🚀 Testing App Builder"
echo "📄 Config: $CONFIG_FILE"
echo "📂 Output: $OUTPUT_DIR"
echo "🌐 Server: http://localhost:3001"
echo ""

# Read the config file
CONFIG_JSON=$(cat "$CONFIG_FILE")

# Send POST request with targetPath
curl -s -X POST http://localhost:3001/api/figma/app-builder/build \
  -H "Content-Type: application/json" \
  -d "{\"config\": $CONFIG_JSON, \"targetPath\": \"$OUTPUT_DIR\"}" \
  | jq '.'

echo ""
echo "✅ Test complete"