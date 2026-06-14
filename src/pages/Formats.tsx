import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Folder, ChevronRight, Youtube, Music, Video, Image, Twitter, Facebook, MessageCircle, Radio } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import type { DownloadFormat, VideoQuality } from '@/types';

const platforms = [
  { name: 'YouTube', icon: Youtube, color: '#FF0000', formats: 'Video, Audio' },
  { name: 'TikTok', icon: Video, color: '#000000', formats: 'Video, Audio' },
  { name: 'Instagram', icon: Image, color: '#E4405F', formats: 'Video, Audio' },
  { name: 'Twitter/X', icon: Twitter, color: '#1DA1F2', formats: 'Video' },
  { name: 'Facebook', icon: Facebook, color: '#1877F2', formats: 'Video' },
  { name: 'Reddit', icon: MessageCircle, color: '#FF4500', formats: 'Video, Audio' },
  { name: 'SoundCloud', icon: Radio, color: '#FF5500', formats: 'Audio' },
];

const qualityOptions: VideoQuality[] = ['720p', '1080p', '4K'];

export default function Formats() {
  const { state, dispatch } = useApp();
  const { settings } = state;
  const [showQualitySheet, setShowQualitySheet] = useState(false);

  const handleFormatChange = (format: DownloadFormat) => {
    dispatch({ type: 'UPDATE_SETTINGS', settings: { defaultFormat: format } });
  };

  const handleQualityChange = (quality: VideoQuality) => {
    dispatch({ type: 'UPDATE_SETTINGS', settings: { defaultQuality: quality } });
    setShowQualitySheet(false);
  };

  const toggleAutoDownload = () => {
    dispatch({ type: 'UPDATE_SETTINGS', settings: { autoDownload: !settings.autoDownload } });
  };

  return (
    <div className="min-h-full pb-28">
      {/* Top Bar */}
      <div className="px-5 pt-3 pb-2">
        <h1 className="text-[28px] font-bold text-[#1B2A4A]">Download Settings</h1>
        <p className="text-[15px] text-[#6B7FA3] mt-1">Customize your download preferences</p>
      </div>

      {/* Default Format Card */}
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="mx-5 mt-5 bg-white rounded-[20px] shadow-raised p-5"
      >
        <h3 className="text-lg font-semibold text-[#1B2A4A] mb-4">Default Format</h3>
        <div className="flex gap-3">
          {(['video', 'audio'] as DownloadFormat[]).map((format) => (
            <button
              key={format}
              onClick={() => handleFormatChange(format)}
              className={`flex-1 h-12 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.97] ${
                settings.defaultFormat === format
                  ? 'bg-[#F26B3A] text-white'
                  : 'bg-[#F2F4F8] text-[#6B7FA3]'
              }`}
            >
              {format === 'video' ? <Video size={18} /> : <Music size={18} />}
              {format === 'video' ? '🎬 Video' : '🎵 Audio'}
            </button>
          ))}
        </div>

        {/* Default Quality */}
        <AnimatePresence>
          {settings.defaultFormat === 'video' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-[#E2E8F0]">
                <p className="text-[13px] text-[#6B7FA3] mb-2">Default Quality</p>
                <button
                  onClick={() => setShowQualitySheet(true)}
                  className="w-full flex items-center justify-between py-2"
                >
                  <span className="text-[15px] text-[#1B2A4A] font-medium">{settings.defaultQuality}</span>
                  <ChevronRight size={18} className="text-[#6B7FA3]" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Save Location Card */}
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mx-5 mt-4 bg-white rounded-[20px] shadow-raised p-5"
      >
        <h3 className="text-lg font-semibold text-[#1B2A4A] mb-3">Save Location</h3>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FFF0EB] rounded-xl flex items-center justify-center">
            <Folder size={20} className="text-[#F26B3A]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] text-[#1B2A4A] truncate">{settings.saveLocation}</p>
            <p className="text-[12px] text-[#6B7FA3]">Default download folder</p>
          </div>
        </div>
      </motion.div>

      {/* Supported Platforms */}
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="px-5 mt-6"
      >
        <h2 className="text-[22px] font-bold text-[#1B2A4A] mb-4">Supported Platforms</h2>
        <div className="bg-white rounded-[20px] overflow-hidden">
          {platforms.map((platform, idx) => {
            const Icon = platform.icon;
            return (
              <div
                key={platform.name}
                className={`flex items-center gap-3 px-4 py-3.5 ${
                  idx < platforms.length - 1 ? 'border-b border-[#E2E8F0]' : ''
                }`}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${platform.color}15` }}
                >
                  <Icon size={16} style={{ color: platform.color }} />
                </div>
                <span className="flex-1 text-[15px] text-[#1B2A4A]">{platform.name}</span>
                <span className="text-[12px] text-[#6B7FA3]">{platform.formats}</span>
                <Check size={16} className="text-[#34C759]" />
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Auto-Download Toggle */}
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mx-5 mt-4 bg-white rounded-[20px] p-5"
      >
        <div className="flex items-center justify-between">
          <span className="text-[15px] text-[#1B2A4A] font-medium">Auto-download on paste</span>
          <button
            onClick={toggleAutoDownload}
            className={`relative w-[52px] h-8 rounded-full transition-colors duration-200 ${
              settings.autoDownload ? 'bg-[#34C759]' : 'bg-[#E2E8F0]'
            }`}
          >
            <motion.div
              animate={{ x: settings.autoDownload ? 22 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="absolute top-[2px] w-7 h-7 bg-white rounded-full shadow-sm"
            />
          </button>
        </div>
        <p className="text-[13px] text-[#6B7FA3] mt-2">
          Automatically start download when a URL is pasted
        </p>
      </motion.div>

      {/* Quality Bottom Sheet */}
      <AnimatePresence>
        {showQualitySheet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-[rgba(27,42,74,0.55)]"
            onClick={() => setShowQualitySheet(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-[#CBD5E0] rounded-full" />
              </div>
              <div className="px-5 pt-3 pb-6">
                <h3 className="text-lg font-semibold text-[#1B2A4A] mb-4">Select Quality</h3>
                <div className="space-y-2">
                  {qualityOptions.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleQualityChange(q)}
                      className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${
                        settings.defaultQuality === q
                          ? 'bg-[#FFF0EB] border-2 border-[#F26B3A]'
                          : 'bg-[#F2F4F8] border-2 border-transparent'
                      }`}
                    >
                      <span className={`text-[15px] font-semibold ${
                        settings.defaultQuality === q ? 'text-[#F26B3A]' : 'text-[#1B2A4A]'
                      }`}>
                        {q}
                      </span>
                      {settings.defaultQuality === q && <Check size={20} className="text-[#F26B3A]" />}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
