const form = document.getElementById('url-form');
const input = document.getElementById('video-url');
const statusEl = document.getElementById('status');
const previewFrame = document.getElementById('yt-preview');
const emptyPreview = document.getElementById('empty-preview');
const platformBadge = document.getElementById('platform-badge');
const startTimeInput = document.getElementById('start-time');
const endTimeInput = document.getElementById('end-time');
const clipDuration = document.getElementById('clip-duration');
const qualitySelect = document.getElementById('quality');
const audioFormatSelect = document.getElementById('audio-format');
const filePrefixInput = document.getElementById('file-prefix');
const commandOutput = document.getElementById('command-output');
const copyCurrentButton = document.getElementById('copy-current');
const commandButtons = document.querySelectorAll('[data-command]');
const nudgeButtons = document.querySelectorAll('[data-nudge]');

const DEFAULT_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

let currentUrl = '';
let currentCommandType = 'video';

function setStatus(message, type = 'neutral') {
  statusEl.textContent = message;
  statusEl.dataset.type = type;
}

function parseUrl(urlString) {
  try {
    return new URL(urlString);
  } catch {
    return null;
  }
}

function detectPlatform(urlString) {
  const url = parseUrl(urlString);
  if (!url) return 'Invalid URL';

  const host = url.hostname.replace(/^www\./, '');
  if (/(^|\.)youtu\.be$|(^|\.)youtube\.com$/.test(host)) return 'YouTube';
  if (host.includes('instagram.com')) return 'Instagram';
  if (host.includes('facebook.com') || host.includes('fb.watch')) return 'Facebook';
  if (host.includes('x.com') || host.includes('twitter.com')) return 'X / Twitter';
  if (host.includes('tiktok.com')) return 'TikTok';
  return 'yt-dlp URL';
}

function extractYouTubeId(urlString) {
  const url = parseUrl(urlString);
  if (!url) return null;

  const host = url.hostname.replace(/^www\./, '');
  if (host === 'youtu.be') return url.pathname.split('/').filter(Boolean)[0] ?? null;
  if (!host.endsWith('youtube.com')) return null;

  if (url.pathname === '/watch') return url.searchParams.get('v');
  if (url.pathname.startsWith('/shorts/')) return url.pathname.split('/')[2] ?? null;
  if (url.pathname.startsWith('/embed/')) return url.pathname.split('/')[2] ?? null;
  return null;
}

function quoteForShell(value) {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function sanitizeName(name) {
  return name
    .replace(/[^a-z0-9-_]/gi, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);
}

function parseTime(value) {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  if (/^\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);

  const parts = trimmed.split(':').map(Number);
  if (parts.some((part) => Number.isNaN(part)) || parts.length > 3) return Number.NaN;

  return parts.reduce((total, part) => (total * 60) + part, 0);
}

function formatTime(totalSeconds) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':');
  }
  return [minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':');
}

function getClipRange() {
  const start = parseTime(startTimeInput.value);
  const end = parseTime(endTimeInput.value);

  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
    return { start: 0, end: 30, duration: 30, isValid: false };
  }

  return { start, end, duration: end - start, isValid: true };
}

function outputTemplate(extension = '%(ext)s') {
  const safeName = sanitizeName(filePrefixInput.value.trim()) || 'youtube-snap-%(title)s';
  return `${safeName}.${extension}`;
}

function getVideoFormatFilter() {
  const quality = qualitySelect.value;
  if (quality === 'best') return 'bv*+ba/b';
  return `bestvideo[height<=${quality}]+bestaudio/best[height<=${quality}]`;
}

function sectionArgument() {
  const range = getClipRange();
  return `*${formatTime(range.start)}-${formatTime(range.end)}`;
}

function buildCommand(type = currentCommandType) {
  if (!currentUrl) return '# Paste and analyze a URL first.';

  const quotedUrl = quoteForShell(currentUrl);
  const quotedOutput = quoteForShell(outputTemplate());

  if (type === 'audio') {
    return `yt-dlp -x --audio-format ${audioFormatSelect.value} -o ${quotedOutput} ${quotedUrl}`;
  }

  if (type === 'gif') {
    return `yt-dlp --download-sections ${quoteForShell(sectionArgument())} --force-keyframes-at-cuts --recode-video gif -o ${quoteForShell(outputTemplate('gif'))} ${quotedUrl}`;
  }

  if (type === 'screenshot') {
    return `yt-dlp --skip-download --write-thumbnail --convert-thumbnails png -o ${quoteForShell(outputTemplate('%(ext)s'))} ${quotedUrl}`;
  }

  const range = getClipRange();
  const clipFlag = range.isValid ? ` --download-sections ${quoteForShell(sectionArgument())} --force-keyframes-at-cuts` : '';
  return `yt-dlp -f ${quoteForShell(getVideoFormatFilter())}${clipFlag} -o ${quotedOutput} ${quotedUrl}`;
}

function refreshTiming() {
  const range = getClipRange();
  clipDuration.textContent = formatTime(range.duration);
  clipDuration.dataset.valid = String(range.isValid);

  if (!range.isValid) {
    setStatus('Clip times need a valid end time after the start time.', 'error');
  }
}

function refreshCommandPreview() {
  refreshTiming();
  commandOutput.value = buildCommand();
}

function updatePreview(url) {
  const platform = detectPlatform(url);
  const videoId = extractYouTubeId(url);

  platformBadge.textContent = platform;

  if (videoId) {
    previewFrame.src = `https://www.youtube.com/embed/${videoId}`;
    previewFrame.hidden = false;
    emptyPreview.hidden = true;
    return;
  }

  previewFrame.removeAttribute('src');
  previewFrame.hidden = true;
  emptyPreview.hidden = false;
}

async function copyCommand(command, label) {
  commandOutput.value = command;

  try {
    await navigator.clipboard.writeText(command);
    setStatus(`${label} copied. Paste it into your terminal.`, 'success');
  } catch {
    commandOutput.focus();
    commandOutput.select();
    setStatus('Clipboard access is blocked. Select and copy the command box manually.', 'error');
  }
}

function analyzeCurrentUrl(url) {
  const parsed = parseUrl(url);
  if (!parsed || !/^https?:$/.test(parsed.protocol)) {
    setStatus('Please enter a valid http(s) video URL.', 'error');
    return;
  }

  currentUrl = url;
  updatePreview(url);
  refreshCommandPreview();
  setStatus(`${detectPlatform(url)} link ready. Pick a classic download mode below.`, 'success');
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  analyzeCurrentUrl(input.value.trim());
});

commandButtons.forEach((button) => {
  button.addEventListener('click', () => {
    currentCommandType = button.dataset.command;
    commandButtons.forEach((item) => item.classList.toggle('active', item === button));
    const command = buildCommand(currentCommandType);
    copyCommand(command, button.querySelector('span').textContent);
  });
});

[startTimeInput, endTimeInput, qualitySelect, audioFormatSelect, filePrefixInput].forEach((element) => {
  element.addEventListener('input', refreshCommandPreview);
  element.addEventListener('change', refreshCommandPreview);
});

nudgeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const target = button.dataset.nudge === 'start' ? startTimeInput : endTimeInput;
    const nextTime = Math.max(0, parseTime(target.value) + Number(button.dataset.delta));
    target.value = formatTime(nextTime);
    refreshCommandPreview();
  });
});

copyCurrentButton.addEventListener('click', () => {
  copyCommand(commandOutput.value, 'Current command');
});

input.value = DEFAULT_URL;
commandButtons[0].classList.add('active');
analyzeCurrentUrl(DEFAULT_URL);
