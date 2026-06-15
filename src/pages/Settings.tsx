import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown, Cloud, Bell, Moon, Wifi, HelpCircle, Shield, FileText,
  Star, Trash2, ChevronRight, AlertTriangle, X, Mail, MessageCircle,
  Check, Download, Folder
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface SettingRowProps {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  badge?: React.ReactNode;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: () => void;
  onClick?: () => void;
  danger?: boolean;
  chevron?: boolean;
}

function SettingRow({ icon, label, sublabel, badge, toggle, toggleValue, onToggle, onClick, danger, chevron = true }: SettingRowProps) {
  return (
    <button
      onClick={onClick || onToggle}
      className={`w-full flex items-center gap-3.5 px-4 py-3.5 active:bg-gray-50 transition-colors ${danger ? 'text-[#FF3B30]' : ''}`}
    >
      <span className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${danger ? 'bg-[#FFF0EB]' : 'bg-[#F0F4FF]'}`}>
        {icon}
      </span>
      <span className="flex-1 text-left">
        <span className={`block text-[15px] font-medium ${danger ? 'text-[#FF3B30]' : 'text-[#1B2A4A]'}`}>{label}</span>
        {sublabel && <span className="block text-[13px] text-[#6B7FA3] mt-0.5">{sublabel}</span>}
      </span>
      {badge}
      {toggle !== undefined && (
        <div className={`w-12 h-6.5 rounded-full transition-colors relative flex-shrink-0 ${toggleValue ? 'bg-[#F26B3A]' : 'bg-[#D1D9E0]'}`}
          style={{ width: 48, height: 26 }}>
          <div className={`absolute top-1 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform ${toggleValue ? 'translate-x-6' : 'translate-x-1'}`}
            style={{ width: 18, height: 18, top: 4, left: toggleValue ? 26 : 4 }} />
        </div>
      )}
      {toggle === undefined && chevron && !badge && (
        <ChevronRight size={16} className="text-[#C0CAD8]" />
      )}
    </button>
  );
}

type Sheet = 'clear' | 'premium' | 'privacy' | 'terms' | 'help' | 'quality' | 'format' | null;

export default function Settings() {
  const { state, dispatch, showToast } = useApp();
  const { settings } = state;
  const [activeSheet, setActiveSheet] = useState<Sheet>(null);

  const updateSetting = (key: keyof typeof settings, value: boolean | string) => {
    dispatch({ type: 'UPDATE_SETTINGS', settings: { [key]: value } });
  };

  const handleClearDownloads = () => {
    dispatch({ type: 'CLEAR_DOWNLOADS' });
    setActiveSheet(null);
    showToast('All downloads cleared');
  };

  const completedDownloads = state.downloads.filter(d => d.status === 'completed');
  const totalStorageMB = completedDownloads.reduce((acc, d) => {
    const match = d.fileSize?.match(/([\d.]+)\s*(MB|GB)/i);
    if (!match) return acc;
    const size = parseFloat(match[1]);
    return acc + (match[2].toUpperCase() === 'GB' ? size * 1024 : size);
  }, 0);
  const storageDisplay = totalStorageMB >= 1024
    ? `${(totalStorageMB / 1024).toFixed(1)} GB`
    : `${Math.round(totalStorageMB)} MB`;

  const qualityOptions = ['720p', '1080p', '4K'] as const;
  const formatOptions = ['video', 'audio'] as const;

  return (
    <div className="flex flex-col h-full bg-[#F7F9FC] overflow-y-auto pb-24">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4">
        <h1 className="text-[22px] font-bold text-[#1B2A4A]">Settings</h1>
      </div>

      {/* Profile Card */}
      <div className="mx-4 mb-4 bg-white rounded-2xl p-4 flex items-center gap-3.5 shadow-sm border border-[#EEF1F8]">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F26B3A] to-[#E05A2B] flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
          SC
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[16px] font-bold text-[#1B2A4A]">SaveClip User</div>
          <div className="text-[13px] text-[#6B7FA3] truncate">Free Plan</div>
        </div>
        <span className="px-2.5 py-1 bg-[#FFF3EE] text-[#F26B3A] text-[11px] font-bold rounded-lg">FREE</span>
      </div>

      {/* Account Group */}
      <div className="mx-4 mb-3 bg-white rounded-2xl overflow-hidden shadow-sm border border-[#EEF1F8] divide-y divide-[#F0F4F8]">
        <div className="px-4 pt-3 pb-1">
          <span className="text-[11px] font-semibold text-[#A0AEBF] uppercase tracking-wider">Account</span>
        </div>
        <SettingRow
          icon={<Crown size={16} className="text-[#F26B3A]" />}
          label="Premium Upgrade"
          sublabel="Unlimited downloads, no ads"
          onClick={() => setActiveSheet('premium')}
        />
        <SettingRow
          icon={<Cloud size={16} className="text-[#6B7FA3]" />}
          label="Storage Used"
          chevron={false}
          badge={
            <span className="text-[13px] font-semibold text-[#6B7FA3]">
              {storageDisplay === '0 MB' ? '0 MB' : storageDisplay} / 16 GB
            </span>
          }
        />
        <SettingRow
          icon={<Download size={16} className="text-[#6B7FA3]" />}
          label="Total Downloads"
          chevron={false}
          badge={
            <span className="text-[13px] font-semibold text-[#6B7FA3]">
              {state.downloads.length}
            </span>
          }
        />
      </div>

      {/* Download Defaults */}
      <div className="mx-4 mb-3 bg-white rounded-2xl overflow-hidden shadow-sm border border-[#EEF1F8] divide-y divide-[#F0F4F8]">
        <div className="px-4 pt-3 pb-1">
          <span className="text-[11px] font-semibold text-[#A0AEBF] uppercase tracking-wider">Download Defaults</span>
        </div>
        <SettingRow
          icon={<Folder size={16} className="text-[#6B7FA3]" />}
          label="Default Format"
          sublabel="Applied to new downloads"
          badge={
            <span className="text-[13px] font-semibold text-[#F26B3A] mr-1 capitalize">
              {settings.defaultFormat}
            </span>
          }
          onClick={() => setActiveSheet('format')}
        />
        <SettingRow
          icon={<Folder size={16} className="text-[#6B7FA3]" />}
          label="Default Quality"
          sublabel="Applied to video downloads"
          badge={
            <span className="text-[13px] font-semibold text-[#F26B3A] mr-1">
              {settings.defaultQuality}
            </span>
          }
          onClick={() => setActiveSheet('quality')}
        />
      </div>

      {/* Preferences Group */}
      <div className="mx-4 mb-3 bg-white rounded-2xl overflow-hidden shadow-sm border border-[#EEF1F8] divide-y divide-[#F0F4F8]">
        <div className="px-4 pt-3 pb-1">
          <span className="text-[11px] font-semibold text-[#A0AEBF] uppercase tracking-wider">Preferences</span>
        </div>
        <SettingRow
          icon={<Bell size={16} className="text-[#6B7FA3]" />}
          label="Notifications"
          sublabel="Download completion alerts"
          toggle
          toggleValue={settings.notifications}
          onToggle={() => updateSetting('notifications', !settings.notifications)}
        />
        <SettingRow
          icon={<Moon size={16} className="text-[#6B7FA3]" />}
          label="Dark Mode"
          sublabel="Switch to dark theme"
          toggle
          toggleValue={settings.darkMode}
          onToggle={() => updateSetting('darkMode', !settings.darkMode)}
        />
        <SettingRow
          icon={<Wifi size={16} className="text-[#6B7FA3]" />}
          label="Download Over Wi-Fi Only"
          sublabel="Avoid mobile data charges"
          toggle
          toggleValue={settings.wifiOnly}
          onToggle={() => updateSetting('wifiOnly', !settings.wifiOnly)}
        />
      </div>

      {/* About Group */}
      <div className="mx-4 mb-3 bg-white rounded-2xl overflow-hidden shadow-sm border border-[#EEF1F8] divide-y divide-[#F0F4F8]">
        <div className="px-4 pt-3 pb-1">
          <span className="text-[11px] font-semibold text-[#A0AEBF] uppercase tracking-wider">About</span>
        </div>
        <SettingRow
          icon={<HelpCircle size={16} className="text-[#6B7FA3]" />}
          label="Help & Support"
          sublabel="FAQs and contact us"
          onClick={() => setActiveSheet('help')}
        />
        <SettingRow
          icon={<Shield size={16} className="text-[#6B7FA3]" />}
          label="Privacy Policy"
          onClick={() => setActiveSheet('privacy')}
        />
        <SettingRow
          icon={<FileText size={16} className="text-[#6B7FA3]" />}
          label="Terms of Service"
          onClick={() => setActiveSheet('terms')}
        />
        <SettingRow
          icon={<Star size={16} className="text-[#F26B3A]" />}
          label="Rate SaveClip"
          sublabel="Enjoying the app? Leave a review"
          onClick={() => showToast('Thanks for the love! ⭐')}
        />
        <SettingRow
          icon={<Trash2 size={16} className="text-[#FF3B30]" />}
          label="Clear All Downloads"
          danger
          onClick={() => setActiveSheet('clear')}
        />
      </div>

      {/* App Version */}
      <div className="text-center py-4 text-[12px] text-[#A0AEBF]">
        SaveClip v1.0.0 · Made with ❤️
      </div>

      {/* Bottom Sheets */}
      <AnimatePresence>
        {activeSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setActiveSheet(null)}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 px-5 pb-10 pt-5 max-h-[85vh] overflow-y-auto"
            >
              <div className="w-10 h-1 bg-[#E2E8F0] rounded-full mx-auto mb-5" />

              {/* Clear Downloads Sheet */}
              {activeSheet === 'clear' && (
                <div className="text-center">
                  <div className="w-14 h-14 bg-[#FFF0EB] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle size={24} className="text-[#FF3B30]" />
                  </div>
                  <h2 className="text-[18px] font-bold text-[#1B2A4A] mb-2">Clear All Downloads?</h2>
                  <p className="text-[14px] text-[#6B7FA3] mb-6">
                    This will remove all {state.downloads.length} downloads from your history. This action cannot be undone.
                  </p>
                  <button onClick={handleClearDownloads}
                    className="w-full h-12 bg-[#FF3B30] text-white font-semibold rounded-xl mb-3">
                    Yes, Clear All
                  </button>
                  <button onClick={() => setActiveSheet(null)}
                    className="w-full h-12 border border-[#E2E8F0] text-[#6B7FA3] font-semibold rounded-xl">
                    Cancel
                  </button>
                </div>
              )}

              {/* Default Format Sheet */}
              {activeSheet === 'format' && (
                <div>
                  <h2 className="text-[18px] font-bold text-[#1B2A4A] mb-5">Default Format</h2>
                  {formatOptions.map((f) => (
                    <button key={f} onClick={() => { updateSetting('defaultFormat', f); setActiveSheet(null); showToast(`Default format set to ${f}`); }}
                      className="w-full flex items-center justify-between px-4 py-4 rounded-xl mb-2 border border-[#E2E8F0] active:bg-[#F7F9FC]">
                      <span className="text-[15px] font-medium text-[#1B2A4A] capitalize">{f === 'video' ? '🎬 Video' : '🎵 Audio'}</span>
                      {settings.defaultFormat === f && <Check size={18} className="text-[#F26B3A]" />}
                    </button>
                  ))}
                </div>
              )}

              {/* Default Quality Sheet */}
              {activeSheet === 'quality' && (
                <div>
                  <h2 className="text-[18px] font-bold text-[#1B2A4A] mb-5">Default Quality</h2>
                  {qualityOptions.map((q) => (
                    <button key={q} onClick={() => { updateSetting('defaultQuality', q); setActiveSheet(null); showToast(`Default quality set to ${q}`); }}
                      className="w-full flex items-center justify-between px-4 py-4 rounded-xl mb-2 border border-[#E2E8F0] active:bg-[#F7F9FC]">
                      <span className="text-[15px] font-medium text-[#1B2A4A]">{q}</span>
                      {settings.defaultQuality === q && <Check size={18} className="text-[#F26B3A]" />}
                    </button>
                  ))}
                </div>
              )}

              {/* Premium Sheet */}
              {activeSheet === 'premium' && (
                <div className="text-center">
                  <div className="text-4xl mb-3">👑</div>
                  <h2 className="text-[20px] font-bold text-[#1B2A4A] mb-2">Go Premium</h2>
                  <p className="text-[14px] text-[#6B7FA3] mb-6">Unlimited downloads, no ads, priority support and 4K quality.</p>
                  {['✅ Unlimited downloads', '✅ No advertisements', '✅ 4K quality support', '✅ Priority support'].map((f) => (
                    <div key={f} className="text-left text-[14px] text-[#1B2A4A] py-2 border-b border-[#F0F4F8]">{f}</div>
                  ))}
                  <button onClick={() => { showToast('Premium coming soon!'); setActiveSheet(null); }}
                    className="w-full h-12 bg-[#F26B3A] text-white font-semibold rounded-xl mt-6">
                    Upgrade — Coming Soon
                  </button>
                </div>
              )}

              {/* Help Sheet */}
              {activeSheet === 'help' && (
                <div>
                  <h2 className="text-[18px] font-bold text-[#1B2A4A] mb-5">Help & Support</h2>
                  <div className="space-y-3 mb-6">
                    {[
                      { q: 'Why is my download stuck?', a: 'Make sure you have a working internet connection. Some platforms may restrict downloads.' },
                      { q: 'Which platforms are supported?', a: 'YouTube, TikTok, Instagram, Twitter/X, Facebook, Reddit, and SoundCloud.' },
                      { q: 'What formats can I download?', a: 'Video (MP4) in 720p, 1080p, or 4K, and Audio (MP3/M4A).' },
                      { q: 'How do I save the file?', a: 'After the download completes, tap "Save to Device" to save the file to your device.' },
                    ].map(({ q, a }) => (
                      <div key={q} className="bg-[#F7F9FC] rounded-xl p-4">
                        <p className="text-[14px] font-semibold text-[#1B2A4A] mb-1">{q}</p>
                        <p className="text-[13px] text-[#6B7FA3]">{a}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[13px] text-[#6B7FA3] text-center mb-3">Need more help? Contact us:</p>
                  <button onClick={() => { window.open('mailto:support@saveclip.app'); setActiveSheet(null); }}
                    className="w-full h-12 bg-[#F26B3A] text-white font-semibold rounded-xl flex items-center justify-center gap-2">
                    <Mail size={16} /> Email Support
                  </button>
                </div>
              )}

              {/* Privacy Sheet */}
              {activeSheet === 'privacy' && (
                <div>
                  <h2 className="text-[18px] font-bold text-[#1B2A4A] mb-4">Privacy Policy</h2>
                  <div className="space-y-4 text-[14px] text-[#4A5568]">
                    <p><strong>Data we collect:</strong> SaveClip stores your download history locally on your device only. We do not collect personal data or send anything to our servers.</p>
                    <p><strong>Cookies:</strong> We use localStorage to save your preferences and download history on-device.</p>
                    <p><strong>Third-party services:</strong> We use yt-dlp to process video URLs. URLs you enter are sent to our backend solely to fetch the video.</p>
                    <p><strong>Your rights:</strong> You can clear all data at any time via Settings → Clear All Downloads.</p>
                    <p className="text-[#A0AEBF]">Last updated: June 2025</p>
                  </div>
                </div>
              )}

              {/* Terms Sheet */}
              {activeSheet === 'terms' && (
                <div>
                  <h2 className="text-[18px] font-bold text-[#1B2A4A] mb-4">Terms of Service</h2>
                  <div className="space-y-4 text-[14px] text-[#4A5568]">
                    <p><strong>Personal use only:</strong> SaveClip is intended for downloading content for personal, offline viewing only.</p>
                    <p><strong>Copyright:</strong> Only download content you have the right to download. Respect creators' copyright and platform terms of service.</p>
                    <p><strong>No warranty:</strong> SaveClip is provided "as is". We are not responsible for any issues arising from its use.</p>
                    <p><strong>Changes:</strong> We may update these terms at any time. Continued use means you accept the updated terms.</p>
                    <p className="text-[#A0AEBF]">Last updated: June 2025</p>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
