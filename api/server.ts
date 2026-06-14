import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory download tracking
const downloadJobs: Record<string, {
  id: string;
  url: string;
  status: 'analyzing' | 'downloading' | 'completed' | 'failed';
  progress: number;
  title: string;
  thumbnail: string;
  platform: string;
  format: string;
  quality: string;
  fileSize: string;
  downloadedSize: string;
  downloadUrl: string | null;
  error: string | null;
}> = {};

// Utility: extract video ID from URL
function extractVideoId(url: string, platform: string): string | null {
  try {
    const u = new URL(url);
    switch (platform) {
      case 'youtube':
        return u.searchParams.get('v') || u.pathname.slice(1) || null;
      case 'tiktok':
        const match = url.match(/\/video\/(\d+)/);
        return match ? match[1] : null;
      case 'instagram':
        const igMatch = url.match(/\/reel\/([^\/]+)/) || url.match(/\/p\/([^\/]+)/);
        return igMatch ? igMatch[1] : null;
      case 'twitter':
        const twMatch = url.match(/\/status\/(\d+)/);
        return twMatch ? twMatch[1] : null;
      default:
        return null;
    }
  } catch {
    return null;
  }
}

// Utility: detect platform
function detectPlatform(url: string): string {
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

// API: Analyze URL - get video info
app.post('/api/analyze', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  const platform = detectPlatform(url);
  if (platform === 'unknown') {
    return res.status(400).json({ error: 'Unsupported platform' });
  }

  try {
    // Use Cobalt API to get video info
    const cobaltRes = await fetch('https://co.wuk.sh/api/json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        url,
        downloadMode: 'auto',
      }),
    });

    if (!cobaltRes.ok) {
      // Fallback: generate basic info
      return res.json({
        success: true,
        platform,
        title: `Video from ${platform.charAt(0).toUpperCase() + platform.slice(1)}`,
        thumbnail: '',
        duration: '0:00',
        formats: ['video', 'audio'],
        qualities: platform === 'soundcloud' ? [] : ['720p', '1080p'],
        fileSize: 'Unknown',
        url,
      });
    }

    const cobaltData = await cobaltRes.json();

    // Fetch additional metadata from YouTube if applicable
    let title = cobaltData.title || `Video from ${platform}`;
    let thumbnail = cobaltData.thumbnail || '';
    let duration = '0:00';

    if (platform === 'youtube') {
      const videoId = extractVideoId(url, 'youtube');
      if (videoId) {
        try {
          const ytRes = await fetch(`https://returnyoutubedislikeapi.com/votes?videoId=${videoId}`);
          if (ytRes.ok) {
            const ytData = await ytRes.json();
            // We get likes/dislikes, not title - use cobalt title
          }
        } catch { /* ignore */ }
      }
    }

    res.json({
      success: true,
      platform,
      title,
      thumbnail,
      duration,
      formats: platform === 'soundcloud' ? ['audio'] : ['video', 'audio'],
      qualities: platform === 'soundcloud' ? [] : ['720p', '1080p'],
      fileSize: 'Unknown',
      url,
      cobaltUrl: cobaltData.url || null,
    });
  } catch (error) {
    console.error('Analyze error:', error);
    // Return basic info even on error
    res.json({
      success: true,
      platform,
      title: `Video from ${platform.charAt(0).toUpperCase() + platform.slice(1)}`,
      thumbnail: '',
      duration: '0:00',
      formats: ['video', 'audio'],
      qualities: ['720p', '1080p'],
      fileSize: 'Unknown',
      url,
    });
  }
});

// API: Start Download
app.post('/api/download', async (req, res) => {
  const { url, format, quality, title } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  const platform = detectPlatform(url);
  const id = Date.now().toString();

  // Create download job
  downloadJobs[id] = {
    id,
    url,
    status: 'analyzing',
    progress: 0,
    title: title || 'Untitled',
    thumbnail: '',
    platform,
    format: format || 'video',
    quality: quality || '720p',
    fileSize: 'Unknown',
    downloadedSize: '0 MB',
    downloadUrl: null,
    error: null,
  };

  // Start async download process
  processDownload(id, url, format, quality);

  res.json({ success: true, id, status: 'analyzing' });
});

// Process download using Cobalt API
async function processDownload(id: string, url: string, format: string, quality: string) {
  const job = downloadJobs[id];
  if (!job) return;

  try {
    // Update to downloading
    job.status = 'downloading';
    job.progress = 10;

    // Call Cobalt API
    const isAudioOnly = format === 'audio';
    const cobaltRes = await fetch('https://co.wuk.sh/api/json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        url,
        downloadMode: 'auto',
        audioFormat: isAudioOnly ? 'mp3' : undefined,
        youtubeVideoCodec: quality === '4K' ? 'h265' : 'h264',
      }),
    });

    if (!cobaltRes.ok) {
      throw new Error('Failed to process download');
    }

    const cobaltData = await cobaltRes.json();

    job.progress = 80;

    if (cobaltData.url) {
      job.downloadUrl = cobaltData.url;
      job.status = 'completed';
      job.progress = 100;
      job.fileSize = 'Ready';
      job.downloadedSize = 'Ready';
    } else if (cobaltData.picker) {
      // Multiple options - pick first
      const firstUrl = cobaltData.picker[0]?.url;
      if (firstUrl) {
        job.downloadUrl = firstUrl;
        job.status = 'completed';
        job.progress = 100;
        job.fileSize = 'Ready';
        job.downloadedSize = 'Ready';
      } else {
        throw new Error('No download URL found');
      }
    } else {
      throw new Error('Failed to get download link');
    }
  } catch (error) {
    console.error('Download error:', error);
    job.status = 'failed';
    job.error = error instanceof Error ? error.message : 'Unknown error';
    job.progress = 0;
  }
}

// API: Get Download Progress
app.get('/api/download/:id/progress', (req, res) => {
  const { id } = req.params;
  const job = downloadJobs[id];

  if (!job) {
    return res.status(404).json({ error: 'Download not found' });
  }

  res.json({
    id: job.id,
    status: job.status,
    progress: job.progress,
    title: job.title,
    thumbnail: job.thumbnail,
    platform: job.platform,
    format: job.format,
    quality: job.quality,
    fileSize: job.fileSize,
    downloadedSize: job.downloadedSize,
    downloadUrl: job.downloadUrl,
    error: job.error,
  });
});

// API: Get all downloads
app.get('/api/downloads', (req, res) => {
  const downloads = Object.values(downloadJobs).map(job => ({
    id: job.id,
    url: job.url,
    title: job.title,
    platform: job.platform,
    thumbnail: job.thumbnail,
    format: job.format,
    quality: job.quality,
    fileSize: job.fileSize,
    progress: job.progress,
    status: job.status,
    downloadUrl: job.downloadUrl,
    date: new Date(parseInt(job.id)).toISOString(),
  }));

  res.json({ downloads: downloads.reverse() });
});

// API: Proxy download - stream file to client
app.get('/api/download/:id/file', async (req, res) => {
  const { id } = req.params;
  const job = downloadJobs[id];

  if (!job || !job.downloadUrl) {
    return res.status(404).json({ error: 'Download not ready' });
  }

  try {
    const response = await fetch(job.downloadUrl);
    if (!response.ok) {
      // If proxy fails, redirect to original URL
      return res.redirect(job.downloadUrl);
    }

    // Stream the response
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const contentDisposition = `attachment; filename="${encodeURIComponent(job.title)}.${job.format === 'audio' ? 'mp3' : 'mp4'}"`;

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', contentDisposition);

    // Pipe the response body
    if (response.body) {
      const reader = response.body.getReader();
      const pump = async () => {
        const { done, value } = await reader.read();
        if (done) {
          res.end();
          return;
        }
        res.write(Buffer.from(value));
        pump();
      };
      pump();
    } else {
      res.redirect(job.downloadUrl);
    }
  } catch {
    // Fallback: redirect to direct URL
    res.redirect(job.downloadUrl);
  }
});

// Serve static files from dist (production build)
app.use(express.static(path.join(__dirname, '../dist')));

// SPA fallback
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`SaveClip API server running on port ${PORT}`);
  console.log(`API endpoints:`);
  console.log(`  POST /api/analyze - Analyze a video URL`);
  console.log(`  POST /api/download - Start a download`);
  console.log(`  GET  /api/download/:id/progress - Check download progress`);
  console.log(`  GET  /api/download/:id/file - Download the file`);
  console.log(`  GET  /api/downloads - List all downloads`);
});
