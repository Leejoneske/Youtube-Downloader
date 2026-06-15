import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const YTDlpWrapModule = require('yt-dlp-wrap');
const YTDlpWrap = YTDlpWrapModule.default ?? YTDlpWrapModule;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ── yt-dlp binary resolution ──────────────────────────────────────────
const CANDIDATE_PATHS = [
  process.env.YT_DLP_PATH,
  path.join(__dirname, '../.pythonlibs/bin/yt-dlp'),
  '/home/runner/workspace/.pythonlibs/bin/yt-dlp',
  '/usr/local/bin/yt-dlp',
  '/usr/bin/yt-dlp',
  '/tmp/yt-dlp',
].filter(Boolean);

let ytDlp = null;
let ytDlpPath = null;
let ytDlpInitPromise = null;

async function ensureYtDlp() {
  if (ytDlp) return ytDlp;
  if (ytDlpInitPromise) return ytDlpInitPromise;

  ytDlpInitPromise = (async () => {
    // Check known local paths first
    const found = CANDIDATE_PATHS.find(p => {
      try { return p !== '/tmp/yt-dlp' && fs.existsSync(p); } catch { return false; }
    });

    if (found) {
      console.log(`yt-dlp found at: ${found}`);
      ytDlpPath = found;
      ytDlp = new YTDlpWrap(found);
      return ytDlp;
    }

    // Download from GitHub (Vercel / other cloud environments)
    const dlPath = '/tmp/yt-dlp';
    if (fs.existsSync(dlPath)) {
      console.log('Using cached /tmp/yt-dlp');
      ytDlpPath = dlPath;
      ytDlp = new YTDlpWrap(dlPath);
      return ytDlp;
    }

    console.log('Downloading yt-dlp binary from GitHub…');
    await YTDlpWrap.downloadFromGithub(dlPath);
    try { fs.chmodSync(dlPath, '755'); } catch {}
    console.log('yt-dlp downloaded to /tmp/yt-dlp');
    ytDlpPath = dlPath;
    ytDlp = new YTDlpWrap(dlPath);
    return ytDlp;
  })();

  return ytDlpInitPromise;
}

// Kick off init in the background so it's ready sooner
ensureYtDlp().catch(() => {});

// ── Helpers ───────────────────────────────────────────────────────────
function detectPlatform(url) {
  const lower = url.toLowerCase();
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
  if (lower.includes('tiktok.com')) return 'tiktok';
  if (lower.includes('instagram.com')) return 'instagram';
  if (lower.includes('twitter.com') || lower.includes('x.com')) return 'twitter';
  if (lower.includes('facebook.com') || lower.includes('fb.watch')) return 'facebook';
  if (lower.includes('reddit.com')) return 'reddit';
  if (lower.includes('soundcloud.com')) return 'soundcloud';
  return 'unknown';
}

function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatBytes(bytes) {
  if (!bytes) return 'Unknown';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb.toFixed(1)} MB`;
}

// oEmbed metadata fetchers — fast, no binary needed
const OEMBED_ENDPOINTS = {
  youtube:    (url) => `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
  tiktok:     (url) => `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`,
  twitter:    (url) => `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}`,
  reddit:     (url) => `https://www.reddit.com/oembed?url=${encodeURIComponent(url)}`,
  soundcloud: (url) => `https://soundcloud.com/oembed?url=${encodeURIComponent(url)}&format=json`,
};

async function fetchOEmbed(url, platform) {
  const endpointFn = OEMBED_ENDPOINTS[platform];
  if (!endpointFn) return null;

  const res = await fetch(endpointFn(url), {
    headers: { 'User-Agent': 'SaveClip/2.0' },
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) return null;

  const data = await res.json();
  return {
    title: data.title || data.author_name || null,
    thumbnail: data.thumbnail_url || null,
    uploader: data.author_name || null,
    duration: null,
  };
}

// ── In-memory download jobs ───────────────────────────────────────────
const downloadJobs = {};

// ── POST /api/analyze ─────────────────────────────────────────────────
app.post('/api/analyze', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  const platform = detectPlatform(url);
  if (platform === 'unknown') return res.status(400).json({ error: 'Unsupported platform' });

  // 1) Try oEmbed (fast, works on all environments)
  let meta = null;
  try { meta = await fetchOEmbed(url, platform); } catch {}

  if (meta?.title) {
    return res.json({
      success: true,
      platform,
      title: meta.title,
      thumbnail: meta.thumbnail || '',
      duration: meta.duration || '0:00',
      uploader: meta.uploader || '',
      formats: platform === 'soundcloud' ? ['audio'] : ['video', 'audio'],
      qualities: platform === 'soundcloud' ? [] : ['720p', '1080p', '4K'],
      fileSize: 'Unknown',
      url,
    });
  }

  // 2) Fallback: try yt-dlp (slower, needs binary)
  try {
    const dlp = await ensureYtDlp();
    const info = await dlp.getVideoInfo([url, '--no-playlist']);
    return res.json({
      success: true,
      platform,
      title: info.title || `Video from ${platform}`,
      thumbnail: info.thumbnail || '',
      duration: formatDuration(info.duration),
      uploader: info.uploader || info.channel || '',
      formats: platform === 'soundcloud' ? ['audio'] : ['video', 'audio'],
      qualities: platform === 'soundcloud' ? [] : ['720p', '1080p', '4K'],
      fileSize: 'Unknown',
      url,
    });
  } catch (err) {
    console.error('yt-dlp analyze error:', err?.message);
  }

  // 3) Final fallback: basic info so UI still works
  const name = platform.charAt(0).toUpperCase() + platform.slice(1);
  res.json({
    success: true,
    platform,
    title: `Video from ${name}`,
    thumbnail: '',
    duration: '0:00',
    uploader: '',
    formats: platform === 'soundcloud' ? ['audio'] : ['video', 'audio'],
    qualities: platform === 'soundcloud' ? [] : ['720p', '1080p', '4K'],
    fileSize: '~48 MB',
    url,
  });
});

// ── POST /api/download ────────────────────────────────────────────────
app.post('/api/download', async (req, res) => {
  const { url, format, quality, title } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  const platform = detectPlatform(url);
  const id = Date.now().toString();

  downloadJobs[id] = {
    id, url, platform,
    title: title || 'Untitled',
    format: format || 'video',
    quality: quality || '1080p',
    status: 'analyzing',
    progress: 0,
    fileSize: 'Unknown',
    downloadedSize: '0 MB',
    filePath: null,
    ext: null,
    error: null,
  };

  processDownload(id, url, format || 'video', quality || '1080p');
  res.json({ success: true, id, status: 'analyzing' });
});

async function processDownload(id, url, format, quality) {
  const job = downloadJobs[id];
  if (!job) return;

  try {
    job.status = 'downloading';
    job.progress = 5;

    const dlp = await ensureYtDlp();

    const tmpBase = path.join(os.tmpdir(), `saveclip_${id}`);
    const tmpTemplate = `${tmpBase}.%(ext)s`;

    let args = [url, '-o', tmpTemplate, '--no-playlist', '--restrict-filenames'];

    if (format === 'audio') {
      args.push('-x', '--audio-format', 'mp3', '--audio-quality', '0');
    } else {
      const heightMap = { '720p': 720, '1080p': 1080, '4K': 2160 };
      const maxH = heightMap[quality] || 1080;
      args.push(
        '-f', `bestvideo[height<=${maxH}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=${maxH}]+bestaudio/best[height<=${maxH}]/best`,
        '--merge-output-format', 'mp4'
      );
    }

    await new Promise((resolve, reject) => {
      const proc = dlp.exec(args);
      job._proc = proc;

      proc.on('progress', (p) => {
        if (p.percent != null) {
          job.progress = Math.min(90, Math.round(p.percent));
          if (p.totalSize) job.downloadedSize = p.totalSize;
        }
      });

      proc.on('close', resolve);
      proc.on('error', reject);
    });

    const tmpDir = os.tmpdir();
    const prefix = `saveclip_${id}.`;
    const files = fs.readdirSync(tmpDir).filter(f => f.startsWith(prefix));
    if (files.length === 0) throw new Error('Output file not found after download');

    const filePath = path.join(tmpDir, files[0]);
    const ext = path.extname(files[0]).slice(1) || (format === 'audio' ? 'mp3' : 'mp4');
    const stat = fs.statSync(filePath);

    job.filePath = filePath;
    job.ext = ext;
    job.status = 'completed';
    job.progress = 100;
    job.fileSize = formatBytes(stat.size);
    job.downloadedSize = job.fileSize;

    setTimeout(() => {
      try { fs.unlinkSync(filePath); } catch {}
      delete downloadJobs[id];
    }, 3600_000);

  } catch (error) {
    console.error(`Download ${id} failed:`, error.message);
    job.status = 'failed';
    job.error = error.message || 'Download failed';
    job.progress = 0;
  }
}

// ── GET /api/download/:id/progress ───────────────────────────────────
app.get('/api/download/:id/progress', (req, res) => {
  const job = downloadJobs[req.params.id];
  if (!job) return res.status(404).json({ error: 'Download not found' });

  res.json({
    id: job.id,
    status: job.status,
    progress: job.progress,
    title: job.title,
    platform: job.platform,
    format: job.format,
    quality: job.quality,
    fileSize: job.fileSize,
    downloadedSize: job.downloadedSize,
    downloadUrl: job.filePath ? `/api/download/${job.id}/file` : null,
    error: job.error,
  });
});

// ── GET /api/download/:id/file ────────────────────────────────────────
app.get('/api/download/:id/file', (req, res) => {
  const job = downloadJobs[req.params.id];
  if (!job || !job.filePath || !fs.existsSync(job.filePath)) {
    return res.status(404).json({ error: 'File not ready or expired' });
  }
  const safeName = (job.title || 'download').replace(/[^\w\s.-]/g, '_').trim();
  res.download(job.filePath, `${safeName}.${job.ext}`);
});

// ── GET /api/downloads ────────────────────────────────────────────────
app.get('/api/downloads', (req, res) => {
  const downloads = Object.values(downloadJobs).map(job => ({
    id: job.id,
    url: job.url,
    title: job.title,
    platform: job.platform,
    thumbnail: job.thumbnail || '',
    format: job.format,
    quality: job.quality,
    fileSize: job.fileSize,
    progress: job.progress,
    status: job.status,
    downloadUrl: job.filePath ? `/api/download/${job.id}/file` : null,
    date: new Date(parseInt(job.id)).toISOString(),
  }));
  res.json({ downloads: downloads.reverse() });
});

// Serve built frontend in production
app.use(express.static(path.join(__dirname, '../dist')));
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`✅ SaveClip API running on port ${PORT}`);
  });
}

export default app;
