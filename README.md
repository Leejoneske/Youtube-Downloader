# YouTube Downloader (Modern Rebuild)

This project is now a **modern frontend companion** for downloading YouTube content using `yt-dlp` on your machine.

## Why this approach?
Direct browser-side downloads from YouTube are unreliable due to CORS/platform restrictions. This app avoids dead backend dependencies and generates robust local commands instead.

## Features
- YouTube URL validation and parsing
- Embedded preview for watch/short links
- Copy-ready commands for:
  - Video download (quality selector)
  - Audio extraction (format selector)
  - Playlist-safe archiving command
- Optional output file naming

## Run locally
Open `index.html` in a browser, or use any static server:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

## Required tools for real downloads
Install yt-dlp + ffmpeg:

```bash
python -m pip install -U yt-dlp
# install ffmpeg from your OS package manager
```
