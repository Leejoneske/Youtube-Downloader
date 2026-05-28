# YouTube Snap

YouTube Snap is back as a lightweight neon downloader helper. The original project tried to download, trim, convert, ping a backend, and embed a player all from one giant HTML file. This rebuild keeps the personality and the cutter/download workflow, but removes dead remote services that made the app fail.

## What works now

- Paste a YouTube, Instagram, Facebook, X/Twitter, TikTok, or other `yt-dlp` supported URL.
- Preview YouTube watch, shorts, and embed links directly in the page.
- Set clip start/end times for video clips and GIF generation.
- Generate copy-ready commands for:
  - video file downloads
  - audio extraction
  - GIF clips
  - thumbnail/screenshot downloads
- Keep the old cyber/neon look without jQuery, Ion RangeSlider, or a mystery backend.

## Run the app

Open `index.html` directly or serve the folder locally:

```bash
python -m http.server 8080
```

Then visit `http://localhost:8080`.

## Download requirements

The browser app generates commands. Run those commands locally with:

```bash
python -m pip install -U yt-dlp
```

Install `ffmpeg` from your OS package manager for best video/audio merging and GIF conversion.

## Why commands instead of direct browser downloads?

Direct browser downloads from major video platforms are blocked by CORS, signatures, rate limits, and platform changes. The old implementation depended on temporary public backend URLs, so it broke when those services went offline. `yt-dlp` is the reliable part; this app is now the friendly interface around it.
