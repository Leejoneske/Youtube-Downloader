import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { spawn } from 'child_process';
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
].filter(Boolean);

let ytDlpInstance = null;
let ytDlpBin = null;
let ytDlpInitPromise = null;

async function ensureYtDlp() {
  if (ytDlpInstance) return { instance: ytDlpInstance, bin: ytDlpBin };
  if (ytDlpInitPromise) return ytDlpInitPromise;

  ytDlpInitPromise = (async () => {
    const found = CANDIDATE_PATHS.find(p => {
      try { return fs.existsSync(p); } catch { return false; }
    });

    if (found) {
      console.log(`yt-dlp found: ${found}`);
      ytDlpBin = found;
      ytDlpInstance = new YTDlpWrap(found);
      return { instance: ytDlpInstance, bin: ytDlpBin };
    }

    const dlPath = '/tmp/yt-dlp';
    if (fs.existsSync(dlPath)) {
      console.log('Using cached /tmp/yt-dlp');
      ytDlpBin = dlPath;
      ytDlpInstance = new YTDlpWrap(dlPath);
      return { instance: ytDlpInstance, bin: ytDlpBin };
    }

    console.log('Downloading yt-dlp binary from GitHub…');
    await YTDlpWrap.downloadFromGithub(dlPath);
    try { fs.chmodSync(dlPath, '755'); } catch {}
    console.log('yt-dlp downloaded to /tmp/yt-dlp');
    ytDlpBin = dlPath;
    ytDlpInstance = new YTDlpWrap(dlPath);
    return { instance: ytDlpInstance, bin: ytDlpBin };
  })();

  return ytDlpInitPromise;
}

// Kick off binary init in background
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

// oEmbed APIs — fast, no binary
const OEMBED_ENDPOINTS = {
  youtube:    (url) => `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
  tiktok:     (url) => `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`,
  twitter:    (url) => `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}`,
  reddit:     (url) => `https://www.reddit.com/oembed?url=${encodeURIComponent(url)}`,
  soundcloud: (url) => `https://soundcloud.com/oembed?url=${encodeURIComponent(url)}&format=json`,
};

async function fetchOEmbed(url, platform) {
  const fn = OEMBED_ENDPOINTS[platform];
  if (!fn) return null;
  try {
    const res = await fetch(fn(url), {
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
  } catch { return null; }
}

// Open Graph scraping — fallback for Facebook, Instagram, and others
async function fetchOpenGraph(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(6000),
      redirect: 'follow',
    });
    if (!res.ok) return null;
    const html = await res.text();

    function getTag(property) {
      const patterns = [
        new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
        new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i'),
        new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
      ];
      for (const p of patterns) {
        const m = html.match(p);
        if (m) return m[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
      }
      return null;
    }

    const title = getTag('og:title') || getTag('twitter:title');
    const thumbnail = getTag('og:image') || getTag('twitter:image');
    if (!title) return null;
    return { title, thumbnail, uploader: null, duration: null };
  } catch { return null; }
}

// ── POST /api/analyze ─────────────────────────────────────────────────
app.post('/api/analyze', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  const platform = detectPlatform(url);
  if (platform === 'unknown') return res.status(400).json({ error: 'Unsupported platform' });

  const base = {
    formats: platform === 'soundcloud' ? ['audio'] : ['video', 'audio'],
    qualities: platform === 'soundcloud' ? [] : ['720p', '1080p', '4K'],
    fileSize: '~48 MB',
    url,
    platform,
  };

  // 1) oEmbed (fast, works for YouTube/TikTok/Twitter/Reddit/SoundCloud)
  const oembed = await fetchOEmbed(url, platform);
  if (oembed?.title) {
    return res.json({ success: true, ...base, ...oembed, duration: oembed.duration || '0:00' });
  }

  // 2) Open Graph scraping (Facebook, Instagram, any other platform)
  const og = await fetchOpenGraph(url);
  if (og?.title) {
    return res.json({ success: true, ...base, ...og, duration: '0:00', uploader: og.uploader || '' });
  }

  // 3) yt-dlp (most accurate but slowest and needs binary)
  try {
    const { instance } = await ensureYtDlp();
    const info = await instance.getVideoInfo([url, '--no-playlist']);
    return res.json({
      success: true, ...base,
      title: info.title || `Video from ${platform}`,
      thumbnail: info.thumbnail || '',
      duration: formatDuration(info.duration),
      uploader: info.uploader || info.channel || '',
    });
  } catch (err) {
    console.error('yt-dlp analyze error:', err?.message);
  }

  // 4) Final fallback
  const name = platform.charAt(0).toUpperCase() + platform.slice(1);
  res.json({ success: true, ...base, title: `Video from ${name}`, thumbnail: '', duration: '0:00', uploader: '' });
});

// ── GET /api/direct-download — single-request streaming download ───────
// Works on Vercel and Replit: no shared state, yt-dlp stdout piped directly.
app.get('/api/direct-download', async (req, res) => {
  const { url, format, quality, title } = req.query;
  if (!url) return res.status(400).json({ error: 'URL required' });

  try {
    const { bin } = await ensureYtDlp();

    const isAudio = format === 'audio';
    const heightMap = { '720p': 720, '1080p': 1080, '4K': 2160 };
    const maxH = heightMap[quality] || 720;

    // For stdout piping we MUST use pre-merged formats (no ffmpeg merge)
    const fmtArg = isAudio
      ? 'bestaudio[ext=mp3]/bestaudio[ext=m4a]/bestaudio'
      : `best[height<=${maxH}][ext=mp4]/best[height<=${maxH}]/best`;

    const ext = isAudio ? 'm4a' : 'mp4';
    const mime = isAudio ? 'audio/mp4' : 'video/mp4';
    const safeName = ((title || 'video') + '').replace(/[^\w\s.-]/g, '_').substring(0, 100);

    res.setHeader('Content-Disposition', `attachment; filename="${safeName}.${ext}"`);
    res.setHeader('Content-Type', mime);
    res.setHeader('Cache-Control', 'no-store');

    const args = [url, '--no-playlist', '-f', fmtArg, '-o', '-', '--no-part'];
    const proc = spawn(bin, args, { stdio: ['ignore', 'pipe', 'pipe'] });

    proc.stdout.pipe(res);
    proc.stderr.on('data', (d) => console.error('[yt-dlp]', d.toString().trim()));
    proc.on('error', (err) => {
      console.error('spawn error:', err.message);
      if (!res.headersSent) res.status(500).send('Download failed: ' + err.message);
    });

    // Kill yt-dlp if client disconnects
    req.on('close', () => { try { proc.kill('SIGTERM'); } catch {} });

  } catch (err) {
    console.error('direct-download setup error:', err.message);
    if (!res.headersSent) res.status(500).json({ error: err.message });
  }
});

// ── In-memory download jobs (for progress tracking on Replit) ─────────
const downloadJobs = {};

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
    status: 'downloading',
    progress: 5,
    fileSize: 'Unknown',
    downloadedSize: '0 MB',
    filePath: null,
    ext: null,
    error: null,
  };

  processDownload(id, url, format || 'video', quality || '1080p');
  res.json({ success: true, id, status: 'downloading' });
});

async function processDownload(id, url, format, quality) {
  const job = downloadJobs[id];
  if (!job) return;
  try {
    const { instance } = await ensureYtDlp();
    const tmpBase = path.join(os.tmpdir(), `saveclip_${id}`);
    const tmpTemplate = `${tmpBase}.%(ext)s`;

    let args = [url, '-o', tmpTemplate, '--no-playlist', '--restrict-filenames'];
    if (format === 'audio') {
      args.push('-x', '--audio-format', 'mp3', '--audio-quality', '0');
    } else {
      const maxH = { '720p': 720, '1080p': 1080, '4K': 2160 }[quality] || 1080;
      args.push(
        '-f', `bestvideo[height<=${maxH}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=${maxH}]+bestaudio/best[height<=${maxH}]/best`,
        '--merge-output-format', 'mp4'
      );
    }

    await new Promise((resolve, reject) => {
      const proc = instance.exec(args);
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

    const files = fs.readdirSync(os.tmpdir()).filter(f => f.startsWith(`saveclip_${id}.`));
    if (!files.length) throw new Error('Output file not found');

    const filePath = path.join(os.tmpdir(), files[0]);
    const ext = path.extname(files[0]).slice(1) || (format === 'audio' ? 'mp3' : 'mp4');

    job.filePath = filePath;
    job.ext = ext;
    job.status = 'completed';
    job.progress = 100;
    job.fileSize = formatBytes(fs.statSync(filePath).size);
    job.downloadedSize = job.fileSize;

    setTimeout(() => { try { fs.unlinkSync(filePath); } catch {} delete downloadJobs[id]; }, 3600_000);
  } catch (err) {
    console.error(`Download ${id} failed:`, err.message);
    job.status = 'failed';
    job.error = err.message || 'Download failed';
    job.progress = 0;
  }
}

app.get('/api/download/:id/progress', (req, res) => {
  const job = downloadJobs[req.params.id];
  if (!job) return res.status(404).json({ error: 'Download not found' });
  res.json({
    id: job.id, status: job.status, progress: job.progress,
    title: job.title, platform: job.platform, format: job.format, quality: job.quality,
    fileSize: job.fileSize, downloadedSize: job.downloadedSize,
    downloadUrl: job.filePath ? `/api/download/${job.id}/file` : null,
    error: job.error,
  });
});

app.get('/api/download/:id/file', (req, res) => {
  const job = downloadJobs[req.params.id];
  if (!job || !job.filePath || !fs.existsSync(job.filePath))
    return res.status(404).json({ error: 'File not ready or expired' });
  const safeName = (job.title || 'download').replace(/[^\w\s.-]/g, '_').trim();
  res.download(job.filePath, `${safeName}.${job.ext}`);
});

app.get('/api/downloads', (req, res) => {
  res.json({
    downloads: Object.values(downloadJobs).reverse().map(j => ({
      id: j.id, url: j.url, title: j.title, platform: j.platform,
      thumbnail: j.thumbnail || '', format: j.format, quality: j.quality,
      fileSize: j.fileSize, progress: j.progress, status: j.status,
      downloadUrl: j.filePath ? `/api/download/${j.id}/file` : null,
      date: new Date(parseInt(j.id)).toISOString(),
    })),
  });
});

app.use(express.static(path.join(__dirname, '../dist')));
app.get('/{*splat}', (req, res) => res.sendFile(path.join(__dirname, '../dist/index.html')));

if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => console.log(`✅ SaveClip API on port ${PORT}`));
}

export default app;
