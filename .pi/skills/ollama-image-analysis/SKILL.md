---
name: ollama-image-analysis
description: Analyze images (screenshots, UI designs, etc.) using a local Ollama instance instead of the built-in image tool which may route to OpenAI. Use when you need to analyze an image and the built-in read tool fails to send it to the correct provider. Sends the image via curl directly to localhost Ollama and captures the text response, which becomes part of this session's context automatically.
compatibility: Requires Ollama running locally (http://localhost:11434) with a vision-capable model like qwen3.6:35b-a3b
---

# Ollama Image Analysis

## Purpose

This skill provides a workaround when the pi agent incorrectly routes images to OpenAI's API instead of a local Ollama instance. It sends images directly to Ollama via `curl` and captures the AI's text analysis response, which naturally becomes part of the session context.

## Why this works within an existing session

When you run the bash command below, the curl output (Ollama's response) is returned as the `bash` tool's stdout. The agent sees this output just like any other tool result — it's automatically in context. **No special session injection is needed.**

## Usage

### Quick analysis

Run the script with an image path and a prompt:

```bash
bash /Users/orso/Source/pacman/.pi/skills/ollama-image-analysis/scripts/analyze.sh <image-path> "<analysis prompt>"
```

Example:
```bash
bash /Users/orso/Source/pacman/.pi/skills/ollama-image-analysis/scripts/analyze.sh ./screenshot.png "Describe this image in detail"
```

### UI/UX review

For a comprehensive UI/UX analysis:

```bash
bash /Users/orso/Source/pacman/.pi/skills/ollama-image-analysis/scripts/analyze.sh ./screenshot.png "Act as a UI/UX designer. Describe this image in detail and list all the flaws and bugs in the screen that need to be fixed, such as overlapping components, opacity issues, layout problems, accessibility concerns, and visual inconsistencies. For each issue, explain how to fix it."
```

### Custom model

Override the model by setting the `OLLAMA_MODEL` environment variable:

```bash
OLLAMA_MODEL="llama3.2-vision:11b" bash /Users/orso/Source/pacman/.pi/skills/ollama-image-analysis/scripts/analyze.sh ./screenshot.png "Analyze this screenshot"
```

### Custom Ollama endpoint

Override the endpoint by setting `OLLAMA_HOST`:

```bash
OLLAMA_HOST="http://localhost:11434" bash /Users/orso/Source/pacman/.pi/skills/ollama-image-analysis/scripts/analyze.sh ./screenshot.png "Analyze"
```

## How it works

1. The script base64-encodes the image file
2. It constructs a proper JSON payload with the image embedded inline
3. It sends the request to Ollama's `/api/chat` endpoint (non-streaming)
4. It extracts and prints the `message.content` from the response
5. This printed output becomes the `bash` tool's stdout, visible to the agent in-session

## Important notes

- The image path must be accessible from the machine running this command
- Ollama must be running on the configured host/port
- The response is returned as plain text — the agent reads it and acts accordingly
- Supported image formats: PNG, JPG, JPEG, GIF, WEBP, BMP, SVG
- The script uses `base64` (macOS/Linux). On macOS, use `base64 -i` flag; on Linux, use `base64 -w0` for no line wraps
