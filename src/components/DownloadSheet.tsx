import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { X, Check, Clock, Loader2, Share2, Download, ExternalLink } from 'lucide-react';
import { useApp } from '@/context/AppContext';

const platformColors: Record<string, string> = {
  youtube: '#FF0000',
  tiktok: '#000000',
  instagram: '#E4405F',
  twitter: '#1DA1F2',
  facebook: '#1877F2',
  reddit: '#FF4500',
  soundcloud: '#FF5500',
  unknown: '#6B7FA3',
};

const platformNames: Record<string, string> = {
  youtube: 'YouTube',
  tiktok: 'TikTok',
  instagram: 'Instagram',
  twitter: 'Twitter/X',
  facebook: 'Facebook',
  reddit: 'Reddit',
  soundcloud: 'SoundCloud',
  unknown: 'Unknown',
};

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function DownloadSheet() {
  const { state, dispatch } = useApp();
  const [showConfetti, setShowConfetti] = useState(false);
  const progressValue = useMotionValue(0);
  const displayProgress = useTransform(progressValue, (v) => Math.round(v));
  const [progressDisplay, setProgressDisplay] = useState(0);

  const download = state.activeDownload;
  const isComplete = download?.status === 'completed';
  const isFailed = download?.status === 'failed';

  useEffect(() => {
    if (download) {
      const controls = animate(progressValue, download.progress, {
        duration: 0.5,
        ease: 'easeOut',
      });
      return () => controls.stop();
    }
  }, [download?.progress, progressValue]);

  useEffect(() => {
    const unsubscribe = displayProgress.on('change', (v) => setProgressDisplay(v));
    return () => unsubscribe();
  }, [displayProgress]);

  useEffect(() => {
    if (isComplete) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [isComplete]);

  // Auto-dismiss after 6 seconds when complete
  useEffect(() => {
    if (isComplete) {
      const timer = setTimeout(() => {
        dispatch({ type: 'RESET_ACTIVE_DOWNLOAD' });
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [isComplete, dispatch]);

  const handleDismiss = () => {
    dispatch({ type: 'SHOW_DOWNLOAD_SHEET', show: false });
    if (isComplete || isFailed) {
      dispatch({ type: 'RESET_ACTIVE_DOWNLOAD' });
    }
  };

  const handleDownloadFile = () => {
    if (!download) return;
    // Use the direct streaming endpoint — works on Vercel and Replit
    const params = new URLSearchParams({
      url: download.url,
      format: download.format || 'video',
      quality: download.quality || '720p',
      title: download.title || 'video',
    });
    window.open(`${API_BASE}/api/direct-download?${params}`, '_blank');
  };

  const handleShare = async () => {
    if (!download) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: download.title,
          text: `Check out: ${download.title}`,
          url: download.url,
        });
      } catch { /* cancelled */ }
    } else {
      navigator.clipboard.writeText(download.url);
    }
  };

  if (!state.showDownloadSheet || !download) return null;

  const circumference = 2 * Math.PI * 70;
  const strokeDashoffset = circumference - (progressDisplay / 100) * circumference;

  const steps = [
    { key: 'analyzing', label: 'Analyzing URL', done: download.status !== 'pending' && download.status !== 'analyzing' },
    { key: 'downloading', label: 'Downloading', done: ['saving', 'completed'].includes(download.status) },
    { key: 'saving', label: 'Processing', done: download.status === 'completed' },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-[rgba(27,42,74,0.55)]"
        onClick={handleDismiss}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[70vh] overflow-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-[#CBD5E0] rounded-full" />
          </div>

          {/* Video info header */}
          <div className="px-5 pt-3 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-medium text-[#1B2A4A] truncate">{download.title}</p>
              </div>
              <button onClick={handleDismiss} className="p-1">
                <X size={20} className="text-[#6B7FA3]" />
              </button>
            </div>
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-white text-[11px] font-semibold"
              style={{ backgroundColor: platformColors[download.platform] || '#6B7FA3' }}>
              {platformNames[download.platform] || 'Unknown'}
              <span className="opacity-80">·</span>
              <span>{download.format}</span>
              {download.quality && <><span className="opacity-80">·</span><span>{download.quality}</span></>}
            </div>
          </div>

          {/* Progress ring */}
          <div className="flex flex-col items-center py-4 relative">
            <div className="relative w-[160px] h-[160px]">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                <circle
                  cx="80" cy="80" r="70"
                  fill="none"
                  stroke="#E2E8F0"
                  strokeWidth="10"
                />
                <motion.circle
                  cx="80" cy="80" r="70"
                  fill="none"
                  stroke={isFailed ? '#FF3B30' : '#F26B3A'}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {isFailed ? (
                  <span className="text-[32px] font-extrabold text-[#FF3B30] leading-none">✕</span>
                ) : (
                  <>
                    <span className={`text-[40px] font-extrabold leading-none ${isComplete ? 'text-[#34C759]' : 'text-[#F26B3A]'}`}>
                      {isComplete ? '100' : progressDisplay}%
                    </span>
                    <AnimatePresence>
                      {isComplete && (
                        <motion.span
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-[13px] text-[#34C759] font-medium mt-1"
                        >
                          Complete
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </div>

              {/* Confetti */}
              <AnimatePresence>
                {showConfetti && (
                  <>
                    {[...Array(12)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ x: 80, y: 80, opacity: 1, scale: 1 }}
                        animate={{
                          x: 80 + (Math.random() - 0.5) * 200,
                          y: 80 + (Math.random() - 0.5) * 200,
                          opacity: 0,
                          scale: 0,
                          rotate: Math.random() * 720,
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="absolute w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: ['#F26B3A', '#34C759', '#FF9500', '#1B2A4A'][i % 4],
                        }}
                      />
                    ))}
                  </>
                )}
              </AnimatePresence>
            </div>
            <p className="text-[13px] text-[#6B7FA3] mt-3">
              {isFailed ? 'Download failed' : isComplete ? 'Ready to save' : `${download.downloadedSize}`}
            </p>
          </div>

          {/* Status steps */}
          {!isFailed && (
            <div className="px-8 py-4">
              <div className="relative">
                {steps.map((step, idx) => (
                  <div key={step.key} className="flex items-start gap-3 relative pb-4 last:pb-0">
                    {idx < steps.length - 1 && (
                      <div className="absolute left-[9px] top-6 w-0.5 h-[calc(100%-12px)] bg-[#FFF0EB]" />
                    )}
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                      step.done
                        ? 'bg-[#34C759]'
                        : step.key === download.status
                        ? 'bg-[#F26B3A]'
                        : 'bg-[#FFF0EB]'
                    }`}>
                      {step.done ? (
                        <Check size={12} className="text-white" strokeWidth={3} />
                      ) : step.key === download.status ? (
                        <Loader2 size={12} className="text-white animate-spin-slow" />
                      ) : (
                        <Clock size={12} className="text-[#6B7FA3]" />
                      )}
                    </div>
                    <div className="pt-0.5">
                      <span className={`text-[13px] ${
                        step.done
                          ? 'text-[#34C759] font-medium'
                          : step.key === download.status
                          ? 'text-[#1B2A4A] font-semibold'
                          : 'text-[#6B7FA3]'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Actions - Success */}
          <AnimatePresence>
            {isComplete && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="px-5 pb-6 pt-2"
              >
                <button
                  onClick={handleDownloadFile}
                  className="w-full h-14 bg-[#F26B3A] text-white text-base font-semibold rounded-2xl shadow-button flex items-center justify-center gap-2 active:scale-[0.97] transition-transform mb-3"
                >
                  <Download size={20} />
                  Save to Device
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={handleShare}
                    className="flex-1 h-12 bg-[#1B2A4A] text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
                  >
                    <Share2 size={18} />
                    Share
                  </button>
                  <button
                    onClick={() => {
                      dispatch({ type: 'RESET_ACTIVE_DOWNLOAD' });
                    }}
                    className="flex-1 h-12 border-[1.5px] border-[#F26B3A] text-[#F26B3A] text-sm font-semibold rounded-xl flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
                  >
                    <ExternalLink size={18} />
                    Download Another
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom Actions - Failed */}
          <AnimatePresence>
            {isFailed && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="px-5 pb-6 pt-2"
              >
                <p className="text-[13px] text-[#6B7FA3] text-center mb-4">
                  We couldn&apos;t process this link. Try again or use a different URL.
                </p>
                <button
                  onClick={() => {
                    dispatch({ type: 'RESET_ACTIVE_DOWNLOAD' });
                  }}
                  className="w-full h-12 bg-[#F26B3A] text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
                >
                  Try Again
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Cancel button during active download */}
          {!isComplete && !isFailed && (
            <div className="px-5 pb-6 pt-2">
              <button
                onClick={() => {
                  dispatch({ type: 'UPDATE_DOWNLOAD', id: download.id, updates: { status: 'failed' } });
                  dispatch({ type: 'RESET_ACTIVE_DOWNLOAD' });
                }}
                className="w-full h-11 text-[#FF3B30] text-sm font-medium rounded-xl flex items-center justify-center"
              >
                Cancel Download
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
