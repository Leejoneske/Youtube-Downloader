import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { Check, Loader2, Download } from 'lucide-react';
import { useApp } from '@/context/AppContext';

const platformColors: Record<string, string> = {
  youtube: '#FF0000', tiktok: '#000000', instagram: '#E4405F',
  twitter: '#1DA1F2', facebook: '#1877F2', reddit: '#FF4500',
  soundcloud: '#FF5500', unknown: '#6B7FA3',
};
const platformNames: Record<string, string> = {
  youtube: 'YouTube', tiktok: 'TikTok', instagram: 'Instagram',
  twitter: 'Twitter/X', facebook: 'Facebook', reddit: 'Reddit',
  soundcloud: 'SoundCloud', unknown: 'Unknown',
};

export default function DownloadSheet() {
  const { state, dispatch, downloadFile } = useApp();
  const [showConfetti, setShowConfetti] = useState(false);
  const progressValue = useMotionValue(0);
  const displayProgress = useTransform(progressValue, (v) => Math.round(v));
  const [progressDisplay, setProgressDisplay] = useState(0);

  const download = state.activeDownload;
  const isComplete = download?.status === 'completed';
  const isFailed = download?.status === 'failed';

  useEffect(() => {
    if (download) {
      const controls = animate(progressValue, download.progress, { duration: 0.5, ease: 'easeOut' });
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

  // Auto-dismiss after 8 seconds when complete
  useEffect(() => {
    if (isComplete) {
      const timer = setTimeout(() => dispatch({ type: 'RESET_ACTIVE_DOWNLOAD' }), 8000);
      return () => clearTimeout(timer);
    }
  }, [isComplete, dispatch]);

  const handleDismiss = () => {
    dispatch({ type: 'SHOW_DOWNLOAD_SHEET', show: false });
    if (isComplete || isFailed) dispatch({ type: 'RESET_ACTIVE_DOWNLOAD' });
  };

  const handleSaveToDevice = () => {
    if (!download) return;
    downloadFile(download);
  };

  if (!state.showDownloadSheet || !download) return null;

  const circumference = 2 * Math.PI * 70;
  const strokeDashoffset = circumference - (progressDisplay / 100) * circumference;
  const color = platformColors[download.platform] || '#F26B3A';

  const steps = [
    { key: 'analyzing', label: 'Analyzing URL', done: download.status !== 'pending' && download.status !== 'analyzing' },
    { key: 'downloading', label: 'Downloading', done: ['saving', 'completed'].includes(download.status) },
    { key: 'saving', label: 'Processing', done: download.status === 'completed' },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-40 flex items-end"
        onClick={handleDismiss}
      >
        <motion.div
          initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="w-full bg-white rounded-t-3xl px-5 pb-10 pt-5"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag handle */}
          <div className="w-10 h-1 bg-[#E2E8F0] rounded-full mx-auto mb-5" />

          {/* Video info */}
          <div className="text-center mb-6">
            <p className="text-[16px] font-bold text-[#1B2A4A] line-clamp-2 mb-1">{download.title}</p>
            <p className="text-[13px] text-[#6B7FA3]">
              {platformNames[download.platform] || 'Unknown'} · {download.format}
              {download.quality && <> · {download.quality}</>}
            </p>
          </div>

          {/* Progress ring */}
          <div className="flex justify-center mb-6">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg width="160" height="160" className="-rotate-90 absolute inset-0">
                <circle cx="80" cy="80" r="70" fill="none" stroke="#F0F4F8" strokeWidth="10" />
                <motion.circle
                  cx="80" cy="80" r="70" fill="none"
                  stroke={isFailed ? '#FF3B30' : color}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={isFailed ? circumference : strokeDashoffset}
                  style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                />
              </svg>
              <div className="relative z-10 text-center">
                {isFailed ? (
                  <span className="text-3xl text-[#FF3B30] font-bold">✕</span>
                ) : isComplete ? (
                  <div className="flex flex-col items-center">
                    <Check size={36} className="text-[#34C759]" />
                    <span className="text-[13px] font-semibold text-[#34C759] mt-1">Complete</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <span className="text-3xl font-bold text-[#1B2A4A]">{progressDisplay}%</span>
                    <span className="text-[12px] text-[#6B7FA3] capitalize mt-0.5">{download.status}</span>
                  </div>
                )}
              </div>

              {/* Confetti */}
              {showConfetti && [...Array(12)].map((_, i) => (
                <motion.div key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{ backgroundColor: i % 2 === 0 ? color : '#34C759' }}
                  initial={{ x: 0, y: 0, opacity: 1 }}
                  animate={{ x: (Math.random() - 0.5) * 120, y: (Math.random() - 0.5) * 120, opacity: 0 }}
                  transition={{ duration: 0.8, delay: i * 0.05 }}
                />
              ))}
            </div>
          </div>

          {/* Status steps */}
          {!isFailed && (
            <div className="flex items-center justify-center gap-2 mb-6">
              {steps.map((step, idx) => (
                <div key={step.key} className="flex items-center gap-2">
                  {idx > 0 && <div className={`w-6 h-px ${step.done ? 'bg-[#34C759]' : 'bg-[#E2E8F0]'}`} />}
                  <div className="flex items-center gap-1.5">
                    {step.done ? (
                      <Check size={14} className="text-[#34C759]" />
                    ) : step.key === download.status ? (
                      <Loader2 size={14} className="text-[#F26B3A] animate-spin" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-[#D1D9E0]" />
                    )}
                    <span className={`text-[12px] font-medium ${step.done ? 'text-[#34C759]' : step.key === download.status ? 'text-[#F26B3A]' : 'text-[#A0AEBF]'}`}>
                      {step.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Actions — Success */}
          {isComplete && (
            <div className="space-y-3">
              <p className="text-center text-[13px] text-[#6B7FA3] mb-2">
                Your file is ready. Tap below to save it to your device.
              </p>
              <button onClick={handleSaveToDevice}
                className="w-full h-12 bg-[#F26B3A] text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 active:scale-[0.97] transition-transform">
                <Download size={16} /> Save to Device
              </button>
              <button onClick={() => dispatch({ type: 'RESET_ACTIVE_DOWNLOAD' })}
                className="w-full h-12 border border-[#E2E8F0] text-[#6B7FA3] text-sm font-semibold rounded-xl active:scale-[0.97] transition-transform">
                Download Another
              </button>
            </div>
          )}

          {/* Actions — Failed */}
          {isFailed && (
            <div className="space-y-3">
              <p className="text-center text-[13px] text-[#FF3B30] mb-2">
                Download failed. The link may be unsupported or expired. Try again.
              </p>
              <button onClick={() => dispatch({ type: 'RESET_ACTIVE_DOWNLOAD' })}
                className="w-full h-12 bg-[#F26B3A] text-white text-sm font-semibold rounded-xl active:scale-[0.97] transition-transform">
                Try Again
              </button>
            </div>
          )}

          {/* Cancel during active */}
          {!isComplete && !isFailed && (
            <button onClick={() => {
              dispatch({ type: 'UPDATE_DOWNLOAD', id: download.id, updates: { status: 'failed' } });
              dispatch({ type: 'RESET_ACTIVE_DOWNLOAD' });
            }}
              className="w-full h-11 text-[#FF3B30] text-sm font-medium rounded-xl flex items-center justify-center mt-2">
              Cancel
            </button>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
