import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, X, Download, Check } from 'lucide-react';
import Marquee from 'react-fast-marquee';
import { useApp } from '@/context/AppContext';
import type { Platform, DownloadFormat, VideoQuality } from '@/types';
import PlatformIcon from '@/components/PlatformIcon';

const platformData: Record<string, { color: string; name: string }> = {
  youtube: { color: '#FF0000', name: 'YouTube' },
  tiktok: { color: '#000000', name: 'TikTok' },
  instagram: { color: '#E4405F', name: 'Instagram' },
  twitter: { color: '#1DA1F2', name: 'Twitter/X' },
  facebook: { color: '#1877F2', name: 'Facebook' },
  reddit: { color: '#FF4500', name: 'Reddit' },
  soundcloud: { color: '#FF5500', name: 'SoundCloud' },
};

export default function Home() {
  const { state, dispatch, detectPlatform, analyzeUrl, startDownload, showToast } = useApp();
  const [url, setUrl] = useState('');
  const [detectedPlatform, setDetectedPlatform] = useState<Platform>('unknown');
  const [showPreview, setShowPreview] = useState(false);
  const [format, setFormat] = useState<DownloadFormat>('video');
  const [quality, setQuality] = useState<VideoQuality>('1080p');
  const [isDownloading, setIsDownloading] = useState(false);
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewDuration, setPreviewDuration] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previewThumbnail, setPreviewThumbnail] = useState('');
  const [previewUploader, setPreviewUploader] = useState('');

  const recentDownloads = state.downloads.filter(d => d.status === 'completed').slice(0, 3);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning!' : hour < 17 ? 'Good afternoon!' : 'Good evening!';

  // Analyze URL when pasted
  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (url.length > 10) {
        const platform = detectPlatform(url);
        setDetectedPlatform(platform);
        
        if (platform !== 'unknown') {
          setIsAnalyzing(true);
          const info = await analyzeUrl(url);
          setIsAnalyzing(false);
          
          if (info) {
            setPreviewTitle(info.title || `Video from ${platform}`);
            setPreviewDuration(info.duration || '0:00');
            setPreviewThumbnail((info as any).thumbnail || '');
            setPreviewUploader((info as any).uploader || '');
            setDetectedPlatform(info.platform);
            setShowPreview(true);
          } else {
            // Fallback
            setPreviewTitle(`Video from ${platform.charAt(0).toUpperCase() + platform.slice(1)}`);
            setPreviewDuration('0:00');
            setPreviewThumbnail('');
            setPreviewUploader('');
            setShowPreview(true);
          }
        } else {
          setShowPreview(false);
        }
      } else {
        setShowPreview(false);
        setDetectedPlatform('unknown');
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [url, detectPlatform, analyzeUrl]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
      showToast('URL pasted from clipboard');
    } catch {
      showToast('Unable to access clipboard');
    }
  };

  const handleDownload = async () => {
    if (!url || detectedPlatform === 'unknown') return;
    setIsDownloading(true);

    const fileSize = format === 'audio' ? '12.4 MB' : quality === '4K' ? '128.5 MB' : quality === '1080p' ? '48.2 MB' : '24.1 MB';

    await startDownload(url, previewTitle, '', previewDuration, detectedPlatform, format, quality, fileSize);
    
    setIsDownloading(false);
    setUrl('');
    setShowPreview(false);
    setDetectedPlatform('unknown');
  };

  const getFileSize = () => {
    if (format === 'audio') return '~12 MB';
    if (quality === '4K') return '~128 MB';
    if (quality === '1080p') return '~48 MB';
    return '~24 MB';
  };

  return (
    <div className="min-h-full pb-28">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-5 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-[#1B2A4A] bg-[#FFF0EB] px-3 py-1.5 rounded-lg">
            🎬 {state.downloads.filter(d => d.status === 'completed').length}
          </span>
          <span className="text-[11px] font-semibold text-[#1B2A4A] bg-[#FFF0EB] px-3 py-1.5 rounded-lg">
            ⭐ {state.downloads.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-lg font-bold text-[#1B2A4A]">SaveClip</span>
          <Download size={12} className="text-[#F26B3A] -ml-0.5" />
        </div>
        <button
          onClick={() => dispatch({ type: 'SET_TAB', tab: 'settings' })}
          className="p-2 active:opacity-60 transition-opacity"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1B2A4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>

      {/* Welcome Header */}
      <div className="px-5 pt-5 pb-2">
        <h1 className="text-[28px] font-bold text-[#1B2A4A] leading-tight tracking-tight">{greeting}</h1>
        <p className="text-[15px] text-[#6B7FA3] mt-1">Paste a link to download</p>
      </div>

      {/* Platform Marquee */}
      <div className="px-5 py-3">
        <Marquee speed={30} gradient gradientWidth={40} gradientColor="#F2F4F8">
          {Object.entries(platformData).map(([key, data]) => (
            <div key={key} className="flex items-center gap-1.5 mx-4">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${data.color}15` }}
              >
                <PlatformIcon platform={key} size={18} />
              </div>
              <span className="text-[13px] text-[#6B7FA3]">{data.name}</span>
            </div>
          ))}
        </Marquee>
      </div>

      {/* URL Input */}
      <div className="px-5 pt-4">
        <div
          className={`relative flex items-center bg-white rounded-2xl border-2 transition-colors duration-200 ${
            showPreview ? 'border-[#F26B3A]' : 'border-[#E2E8F0]'
          }`}
        >
          <Link size={20} className="text-[#6B7FA3] ml-4 flex-shrink-0" />
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste video or audio link here…"
            className="flex-1 h-14 px-3 text-[14px] text-[#1B2A4A] placeholder:text-[#6B7FA3] bg-transparent outline-none"
          />
          {url && (
            <button onClick={() => { setUrl(''); setShowPreview(false); setPreviewThumbnail(''); setPreviewUploader(''); }} className="p-2 mr-2">
              <X size={18} className="text-[#6B7FA3]" />
            </button>
          )}
          {isAnalyzing && (
            <div className="mr-4">
              <div className="w-5 h-5 border-2 border-[#F26B3A] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {showPreview && detectedPlatform !== 'unknown' && !isAnalyzing && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-6 h-6 rounded-full mr-3 flex-shrink-0"
              style={{ backgroundColor: platformData[detectedPlatform]?.color }}
            />
          )}
        </div>

        {/* Quick Action Chips */}
        <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar snap-x">
          <button
            onClick={handlePaste}
            className="flex-shrink-0 snap-start bg-white border border-[#E2E8F0] rounded-xl px-3.5 py-2 text-[13px] text-[#6B7FA3] font-medium active:scale-95 transition-transform"
          >
            📋 Paste
          </button>
          <button
            onClick={() => showToast('Browse feature coming soon')}
            className="flex-shrink-0 snap-start bg-white border border-[#E2E8F0] rounded-xl px-3.5 py-2 text-[13px] text-[#6B7FA3] font-medium active:scale-95 transition-transform"
          >
            📁 Browse
          </button>
          <button
            onClick={() => {
              if (state.downloads.length > 0) {
                const recent = state.downloads[0];
                setUrl(recent.url);
              } else {
                showToast('No recent URLs');
              }
            }}
            className="flex-shrink-0 snap-start bg-white border border-[#E2E8F0] rounded-xl px-3.5 py-2 text-[13px] text-[#6B7FA3] font-medium active:scale-95 transition-transform"
          >
            📎 Recent
          </button>
        </div>
      </div>

      {/* Smart Preview Card */}
      <AnimatePresence>
        {showPreview && detectedPlatform !== 'unknown' && (
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="mx-5 mt-4 bg-white rounded-[20px] shadow-raised p-4"
          >
            {/* Platform badge */}
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${platformData[detectedPlatform]?.color}15` }}
              >
                <PlatformIcon platform={detectedPlatform} size={12} />
              </div>
              <span className="text-[13px] font-medium" style={{ color: platformData[detectedPlatform]?.color }}>
                {platformData[detectedPlatform]?.name}
              </span>
              <span className="text-[11px] font-semibold text-[#34C759] bg-[#34C75915] px-2 py-0.5 rounded-md ml-auto">
                Detected
              </span>
            </div>

            {/* Thumbnail + Title */}
            <div className="flex gap-3 mb-4">
              {previewThumbnail ? (
                <img
                  src={previewThumbnail}
                  alt="thumbnail"
                  className="w-20 h-14 rounded-xl object-cover flex-shrink-0 bg-[#F2F4F8]"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <div className="w-20 h-14 rounded-xl flex-shrink-0 flex items-center justify-center"
                  style={{ backgroundColor: `${platformData[detectedPlatform]?.color}15` }}>
                  <PlatformIcon platform={detectedPlatform} size={28} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[15px] text-[#1B2A4A] line-clamp-2 leading-snug">{previewTitle}</p>
                {previewUploader && (
                  <p className="text-[12px] text-[#6B7FA3] mt-0.5 truncate">{previewUploader}</p>
                )}
                {previewDuration && previewDuration !== '0:00' && (
                  <p className="text-[12px] text-[#6B7FA3] mt-0.5">{previewDuration}</p>
                )}
              </div>
            </div>

            {/* Format Selector */}
            <div className="mb-3">
              <p className="text-[13px] text-[#6B7FA3] mb-2">Format</p>
              <div className="flex gap-2">
                {(['video', 'audio'] as DownloadFormat[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={`flex-1 h-10 rounded-xl text-sm font-semibold transition-all ${
                      format === f
                        ? 'bg-[#F26B3A] text-white'
                        : 'bg-white border border-[#E2E8F0] text-[#6B7FA3]'
                    }`}
                  >
                    {f === 'video' ? '🎬 Video' : '🎵 Audio'}
                  </button>
                ))}
              </div>
            </div>

            {/* Quality Selector */}
            {format === 'video' && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}>
                <p className="text-[13px] text-[#6B7FA3] mb-2">Quality</p>
                <div className="flex gap-2">
                  {(['720p', '1080p', '4K'] as VideoQuality[]).map((q) => (
                    <button
                      key={q}
                      onClick={() => setQuality(q)}
                      className={`flex-1 h-9 rounded-lg text-sm font-medium transition-all ${
                        quality === q
                          ? 'bg-[#F26B3A] text-white'
                          : 'bg-white border border-[#E2E8F0] text-[#6B7FA3]'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Download Button */}
      <AnimatePresence>
        {showPreview && detectedPlatform !== 'unknown' && (
          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.15 }}
            className="px-5 mt-4"
          >
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="w-full h-14 bg-[#F26B3A] text-white text-base font-semibold rounded-2xl shadow-button flex items-center justify-center gap-2 active:scale-[0.97] active:bg-[#E25A2D] transition-all disabled:opacity-45 disabled:shadow-none"
            >
              {isDownloading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Starting…
                </>
              ) : (
                <>
                  <span className="text-lg">⬇</span> Download Now
                  <span className="text-[13px] font-normal opacity-80">({getFileSize()})</span>
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Default state button */}
      {!showPreview && (
        <div className="px-5 mt-4">
          <button
            disabled
            className="w-full h-14 bg-[#F26B3A] text-white text-base font-semibold rounded-2xl opacity-45 flex items-center justify-center"
          >
            Paste a link first
          </button>
        </div>
      )}

      {/* Recent Downloads */}
      {recentDownloads.length > 0 && (
        <div className="px-5 mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[22px] font-bold text-[#1B2A4A]">Recent Downloads</h2>
            <button
              onClick={() => dispatch({ type: 'SET_TAB', tab: 'downloads' })}
              className="text-[13px] font-medium text-[#F26B3A]"
            >
              See All →
            </button>
          </div>
          <div className="space-y-3">
            {recentDownloads.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: idx * 0.06 }}
                className="bg-white rounded-2xl p-3.5 flex items-center gap-3"
              >
                <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center"
                  style={{ backgroundColor: `${platformData[item.platform]?.color || '#6B7FA3'}15` }}>
                  <PlatformIcon platform={item.platform} size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] text-[#1B2A4A] truncate">{item.title}</p>
                  <p className="text-[13px] text-[#6B7FA3]">
                    {platformData[item.platform]?.name || item.platform} · {item.format} · {item.quality}
                  </p>
                </div>
                <Check size={18} className="text-[#34C759] flex-shrink-0" />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {recentDownloads.length === 0 && state.downloads.length === 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col items-center mt-12 px-5"
        >
          <img
            src="/images/hero-mascot.png"
            alt="Mascot"
            className="w-40 h-40 object-contain"
          />
          <h2 className="text-[22px] font-bold text-[#1B2A4A] mt-4">Ready to download!</h2>
          <p className="text-[15px] text-[#6B7FA3] text-center mt-2">
            Paste a URL from YouTube, TikTok, or any supported platform above
          </p>
        </motion.div>
      )}
    </div>
  );
}
