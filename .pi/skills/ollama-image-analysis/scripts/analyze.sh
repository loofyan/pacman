#!/usr/bin/env bash
# analyze.sh - Send an image to local Ollama for analysis
# Usage: analyze.sh <image-path> "<prompt>"
# Env:  OLLAMA_MODEL (default: qwen3.6:35b-a3b)
#        OLLAMA_HOST   (default: http://localhost:11434)
#
# How this works within an existing pi session:
# The agent runs this via the `bash` tool. The script's stdout (Ollama's analysis)
# becomes the bash tool's output, which is automatically part of the agent's
# conversation context. No special session injection needed — the text response
# from Ollama is read by the agent just like any other tool result.

set -euo pipefail

IMAGE_PATH="${1:-}"
PROMPT="${2:-Describe this image in detail}"

if [ -z "$IMAGE_PATH" ]; then
  echo "Error: No image path provided."
  echo "Usage: $0 <image-path> \"<prompt>\""
  exit 1
fi

if [ ! -f "$IMAGE_PATH" ]; then
  echo "Error: File not found: $IMAGE_PATH"
  exit 1
fi

MODEL="${OLLAMA_MODEL:-qwen3.6:35b-a3b}"
HOST="${OLLAMA_HOST:-http://localhost:11434}"

# Encode image to base64 (handle both macOS and Linux base64 variants)
# macOS: base64 -i, Linux: base64 -w0 (no line wrapping)
BASE64_IMG=""
if base64 -i "$IMAGE_PATH" >/dev/null 2>&1; then
  BASE64_IMG=$(base64 -i "$IMAGE_PATH" | tr -d '\n')
elif base64 -w0 "$IMAGE_PATH" >/dev/null 2>&1; then
  BASE64_IMG=$(base64 -w0 "$IMAGE_PATH")
else
  BASE64_IMG=$(base64 "$IMAGE_PATH" | tr -d '\n')
fi

if [ -z "$BASE64_IMG" ]; then
  echo "Error: Failed to base64 encode image: $IMAGE_PATH"
  exit 1
fi

# Build JSON payload using python3 for safe JSON encoding.
# This avoids shell injection and quoting issues with special characters
# in the prompt (quotes, backticks, dollar signs, newlines, etc.)
PAYLOAD=$(python3 -c "
import json, sys
payload = {
    'model': sys.argv[1],
    'messages': [{
        'role': 'user',
        'content': sys.argv[2],
        'images': [sys.argv[3]]
    }],
    'stream': False
}
print(json.dumps(payload))
" "$MODEL" "$PROMPT" "$BASE64_IMG")

# Send to Ollama and extract the response
RESPONSE=$(curl -s -X POST "${HOST}/api/chat" \
   -H "Content-Type: application/json" \
   -d "$PAYLOAD" 2>&1) || {
  echo "Error: curl request to ${HOST}/api/chat failed"
  echo "$RESPONSE"
  exit 1
}

# Extract and print the message content from the JSON response
CONTENT=$(python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data['message']['content'])
except (json.JSONDecodeError, KeyError) as e:
    print(f'Error parsing Ollama response: {e}', file=sys.stderr)
    sys.exit(1)
" <<< "$RESPONSE")

if [ $? -ne 0 ]; then
  echo "Error: Failed to extract response content from Ollama"
  echo "Raw response: $RESPONSE"
  exit 1
fi

# Output the analysis — this stdout becomes the bash tool's output
# and is read by the agent as part of the session context
echo "$CONTENT"
