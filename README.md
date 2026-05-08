# LinkedIn Slop Filter

A Chrome extension that detects AI-generated LinkedIn posts and collapses them into a short summary.

## Features
-Scores posts locally using a very simple heuristic detector to save on API cost and speed.
-Collapses posts that score over threshold and replaces them with a summary
-Batches multiple posts at once to save on rate limits (so dont scroll too too fast or you might miss some)
-Supports Groq (default), Ollam, and other OpenAI compatible providers
-Threshold, summary tone, length all customizable to your needs with a very simple settings menu

## Setup
1. Clone this repo
2. Go to `chrome://extensions`
3. Enable Developer Mode
4. Click "Load unpacked" and select this folder
5. Open Settings and add your Groq API key (free at console.groq.com)
6. Specify the model in the settings or otherwise it defaults to "llama-3.1-8b-instant" 

## Stack
- Vanilla JS, Chrome Extension Manifest V3
- Groq API (llama-3.1-8b-instant by default)
- No build step, no dependencies
