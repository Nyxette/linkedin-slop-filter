# LinkedIn Slop Filter

A Chrome extension that detects AI-generated LinkedIn posts and collapses them into a short summary.

## Features
- Scores posts locally using a very simple heuristic detector to save on API cost and speed.
- Collapses posts that score over threshold and replaces them with a summary
- Batches multiple posts at once to save on rate limits (so dont scroll too too fast or you might miss some)
- Supports Groq (default), Ollam, and other OpenAI compatible providers
- Threshold, summary tone, length all customizable to your needs with a very simple settings menu

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

## Some Images

- Example 1
<img width="726" height="832" alt="{7AA6FBCB-5079-4A66-95C6-0FCDA991142B}" src="https://github.com/user-attachments/assets/ef6a4a1e-6812-4557-8bd6-48000b836886" />
<img width="737" height="819" alt="{7C999A4F-4428-48AA-84EE-BFF01B24EE3A}" src="https://github.com/user-attachments/assets/90354f0b-aca4-4636-a30a-0453e5ffdde3" />

- Example 2
<img width="735" height="812" alt="{1B1D73EC-B1E3-47FC-81D8-72872505A9A5}" src="https://github.com/user-attachments/assets/1e0522ca-cade-41fe-96c5-78ee9c5a1988" />
<img width="719" height="806" alt="{253780B6-4467-4D58-919D-C7DDB3224900}" src="https://github.com/user-attachments/assets/c90a50cf-836d-4f7e-a403-18f5f497554e" />

- Example 3
<img width="682" height="606" alt="{B32F13A1-3E40-438E-BD4C-E1000E7198AC}" src="https://github.com/user-attachments/assets/61e7191c-14ad-4924-bcaf-735d7bf81424" />
<img width="711" height="868" alt="{CB395A79-C703-4620-AB96-996FF1DBF0FA}" src="https://github.com/user-attachments/assets/6bab4484-2032-48a0-87c7-37607b7ec7b7" />

### Footnote
Since it uses a heuristic checker instead of an AI model theres bound to be False Positives if you keep the threshold too low, and a lot of misses if you keep it too high. I personally reccomend a threshold of about 45 for general cases. Although i'd argue that the summary even on false positives helped me decide if i wanted to spend more time on this or not


