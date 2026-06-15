# SaveClip

A React + TypeScript + Vite frontend with an Express backend for downloading videos from YouTube, TikTok, Instagram, Twitter/X, Facebook, Reddit, and SoundCloud.

## Architecture

- **Frontend**: React + Vite, port 5000 (`npm run dev`)
- **Backend**: Express (`node api/server.js`), port 3001
- **Downloader**: `yt-dlp` binary at `.pythonlibs/bin/yt-dlp`
- **GitHub repo**: `Leejoneske/Youtube-Downloader` (main branch)

## Workflows

- `Start Frontend` — `npm run dev`
- `Start Backend` — `node api/server.js`

## Pushing to GitHub

Use the token-embedded URL (git config writes are blocked):
```
git push "https://$GITHUB_TOKEN@github.com/Leejoneske/Youtube-Downloader.git" main
```

## User preferences

- **Auto-push to GitHub main after every change** — do not wait to be asked; push automatically after completing any task.
