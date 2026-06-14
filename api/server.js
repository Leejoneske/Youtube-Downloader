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
const downloadJobs = {};

// Utility: detect platform
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

    let title = cobaltData.title || `Video from ${platform}`;
    let thumbnail = cobaltData.thumbnail || '';
    let duration = '0:00';

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
async function processDownload(id, url, format, quality) {
  const job = downloadJobs[id];
  if (!job) return;

  try {
    job.status = 'downloading';
    job.progress = 10;

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
    } else if (cobaltData.picker && cobaltData.picker.length > 0) {
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
    } else if (cobaltData.audio && cobaltData.audio.url) {
      job.downloadUrl = cobaltData.audio.url;
      job.status = 'completed';
      job.progress = 100;
      job.fileSize = 'Ready';
      job.downloadedSize = 'Ready';
    } else {
      throw new Error('Failed to get download link');
    }
  } catch (error) {
    console.error('Download error:', error);
    job.status = 'failed';
    job.error = error.message || 'Unknown error';
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
      return res.redirect(job.downloadUrl);
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const fileExt = job.format === 'audio' ? 'mp3' : 'mp4';
    const contentDisposition = `attachment; filename="${encodeURIComponent(job.title || 'download')}.${fileExt}"`;

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', contentDisposition);

    if (response.body) {
      const reader = response.body.getReader();
      const pump = async () => {
        try {
          const { done, value } = await reader.read();
          if (done) {
            res.end();
            return;
          }
          res.write(Buffer.from(value));
          pump();
        } catch {
          res.end();
        }
      };
      pump();
    } else {
      res.redirect(job.downloadUrl);
    }
  } catch {
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
  console.log(`✅ SaveClip API server running on port ${PORT}`);
  console.log('');
  console.log('📡 API Endpoints:');
  console.log(`   POST /api/analyze       - Analyze a video URL`);
  console.log(`   POST /api/download      - Start a download`);
  console.log(`   GET  /api/download/:id  - Check progress & download file`);
  console.log(`   GET  /api/downloads     - List all downloads`);
  console.log('');
  console.log(`🌐 Frontend: http://localhost:${PORT}`);
});
