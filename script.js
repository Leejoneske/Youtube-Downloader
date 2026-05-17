const form = document.getElementById('url-form');
const input = document.getElementById('video-url');
const statusEl = document.getElementById('status');
const previewSection = document.getElementById('preview-section');
const previewFrame = document.getElementById('yt-preview');
const copyVideoBtn = document.getElementById('copy-video-cmd');
const copyAudioBtn = document.getElementById('copy-audio-cmd');
const copyPlaylistBtn = document.getElementById('copy-playlist-cmd');
const openLink = document.getElementById('open-link');
const qualitySelect = document.getElementById('quality');
const audioFormatSelect = document.getElementById('audio-format');
const filePrefixInput = document.getElementById('file-prefix');
const commandOutput = document.getElementById('command-output');

let currentUrl = '';

function setStatus(message, type = '') {
  statusEl.textContent = message;
  statusEl.className = type;
}

function isYouTubeUrl(urlString) {
  try {
    const url = new URL(urlString);
    return /(^|\.)youtube\.com$|(^|\.)youtu\.be$/.test(url.hostname);
  } catch {
    return false;
  }
}

function extractYouTubeId(urlString) {
  try {
    const url = new URL(urlString);
    if (url.hostname.includes('youtu.be')) return url.pathname.split('/').filter(Boolean)[0] ?? null;
    if (url.searchParams.get('v')) return url.searchParams.get('v');
    if (url.pathname.startsWith('/shorts/')) return url.pathname.split('/')[2] ?? null;
  } catch {
    return null;
  }
  return null;
}

function quoteForShell(value) {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function sanitizeName(name) {
  return name.replace(/[^a-z0-9-_]/gi, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '').slice(0, 80);
}

function outputTemplate() {
  const safe = sanitizeName(filePrefixInput.value.trim());
  if (!safe) return '%(title)s.%(ext)s';
  return `${safe}.%(ext)s`;
}

function getVideoFormatFilter() {
  const quality = qualitySelect.value;
  if (quality === 'best') return '"bv*+ba/b"';
  return `"bestvideo[height<=${quality}]+bestaudio/best[height<=${quality}]"`;
}

function buildVideoCommand() {
  return `yt-dlp -f ${getVideoFormatFilter()} -o ${quoteForShell(outputTemplate())} ${quoteForShell(currentUrl)}`;
}

function buildAudioCommand() {
  const audioFormat = audioFormatSelect.value;
  return `yt-dlp -x --audio-format ${audioFormat} -o ${quoteForShell(outputTemplate())} ${quoteForShell(currentUrl)}`;
}

function buildPlaylistSafeCommand() {
  return `yt-dlp --yes-playlist --download-archive downloaded.txt -o ${quoteForShell('%(playlist_title)s/%(title)s.%(ext)s')} ${quoteForShell(currentUrl)}`;
}

async function copyText(text, label) {
  commandOutput.value = text;
  try {
    await navigator.clipboard.writeText(text);
    setStatus(`${label} copied to clipboard.`, 'success');
  } catch {
    setStatus('Clipboard permissions unavailable. Copy from the preview box below.', 'error');
  }
}

function refreshCommandPreview() {
  if (!currentUrl) return;
  commandOutput.value = buildVideoCommand();
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const url = input.value.trim();

  if (!url) return setStatus('Please paste a URL first.', 'error');
  if (!isYouTubeUrl(url)) return setStatus('Please enter a valid YouTube link.', 'error');

  currentUrl = url;
  openLink.href = url;

  const ytId = extractYouTubeId(url);
  if (!ytId) return setStatus('Could not parse YouTube video ID from this link.', 'error');

  previewFrame.src = `https://www.youtube.com/embed/${ytId}`;
  previewSection.hidden = false;
  refreshCommandPreview();
  setStatus('Ready. Choose options and copy command.', 'success');
});

qualitySelect.addEventListener('change', refreshCommandPreview);
audioFormatSelect.addEventListener('change', refreshCommandPreview);
filePrefixInput.addEventListener('input', refreshCommandPreview);

copyVideoBtn.addEventListener('click', () => {
  if (!currentUrl) return setStatus('Analyze a URL first.', 'error');
  copyText(buildVideoCommand(), 'Video command');
});

copyAudioBtn.addEventListener('click', () => {
  if (!currentUrl) return setStatus('Analyze a URL first.', 'error');
  copyText(buildAudioCommand(), 'Audio command');
});

copyPlaylistBtn.addEventListener('click', () => {
  if (!currentUrl) return setStatus('Analyze a URL first.', 'error');
  copyText(buildPlaylistSafeCommand(), 'Playlist-safe command');
});
