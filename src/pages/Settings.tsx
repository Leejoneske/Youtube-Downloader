import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown, Cloud, Bell, Moon, Wifi, HelpCircle, Shield, FileText, Star, Trash2,
  ChevronRight, AlertTriangle, X, Mail, MessageCircle, Check
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
      onClick={toggle ? onToggle : onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-[#F0F2F5] transition-colors text-left"
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
        danger ? 'bg-[#FFF0EB]' : 'bg-[#F2F4F8]'
      }`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <span className={`block text-[15px] ${danger ? 'text-[#FF3B30]' : 'text-[#1B2A4A]'}`}>{label}</span>
        {sublabel && <span className="block text-[12px] text-[#6B7FA3] mt-0.5">{sublabel}</span>}
      </div>
      {badge}
      {toggle !== undefined && (
        <div
          className={`relative w-[52px] h-8 rounded-full transition-colors duration-200 flex-shrink-0 ${
            toggleValue ? 'bg-[#34C759]' : 'bg-[#E2E8F0]'
          }`}
        >
          <motion.div
            animate={{ x: toggleValue ? 22 : 2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="absolute top-[2px] w-7 h-7 bg-white rounded-full shadow-sm"
          />
        </div>
      )}
      {toggle === undefined && chevron && !badge && (
        <ChevronRight size={18} className="text-[#A0AEC0] flex-shrink-0" />
      )}
    </button>
  );
}

type Sheet = 'clear' | 'premium' | 'privacy' | 'terms' | 'help' | null;

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

  const storageLimit = '16 GB';

  return (
    <div className="min-h-full pb-28">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-5 pt-3 pb-2">
        <h1 className="text-[28px] font-bold text-[#1B2A4A]">Settings</h1>
      </div>

      {/* Profile Card */}
      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.02 }}
        className="mx-5 mt-3 bg-white rounded-[20px] p-4 flex items-center gap-3"
      >
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#F26B3A] to-[#FF9A5C] flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xl font-bold">AJ</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[17px] font-semibold text-[#1B2A4A]">Alex Johnson</p>
          <p className="text-[13px] text-[#6B7FA3] truncate">alex@saveclip.app</p>
        </div>
        <div className="px-2.5 py-1 rounded-lg bg-[#FFF0EB]">
          <span className="text-[11px] font-semibold text-[#F26B3A]">FREE</span>
        </div>
      </motion.div>

      {/* Account Group */}
      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="mx-5 mt-4 bg-white rounded-[20px] overflow-hidden"
      >
        <SettingRow
          icon={<Crown size={18} className="text-[#F26B3A]" />}
          label="Premium Upgrade"
          sublabel="Unlimited downloads, no ads"
          onClick={() => setActiveSheet('premium')}
        />
        <div className="h-px bg-[#E2E8F0] ml-16" />
        <SettingRow
          icon={<Cloud size={18} className="text-[#1B2A4A]" />}
          label="Storage Used"
          chevron={false}
          badge={
            <span className="text-[12px] text-[#6B7FA3] flex-shrink-0">
              {storageDisplay} / {storageLimit}
            </span>
          }
        />
      </motion.div>

      {/* Preferences Group */}
      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mx-5 mt-4 bg-white rounded-[20px] overflow-hidden"
      >
        <SettingRow
          icon={<Bell size={18} className="text-[#1B2A4A]" />}
          label="Notifications"
          sublabel="Download completion alerts"
          toggle
          toggleValue={settings.notifications}
          onToggle={() => updateSetting('notifications', !settings.notifications)}
        />
        <div className="h-px bg-[#E2E8F0] ml-16" />
        <SettingRow
          icon={<Moon size={18} className="text-[#1B2A4A]" />}
          label="Dark Mode"
          sublabel="Switch to dark theme"
          toggle
          toggleValue={settings.darkMode}
          onToggle={() => updateSetting('darkMode', !settings.darkMode)}
        />
        <div className="h-px bg-[#E2E8F0] ml-16" />
        <SettingRow
          icon={<Wifi size={18} className="text-[#1B2A4A]" />}
          label="Download Over Wi-Fi Only"
          sublabel="Avoid mobile data charges"
          toggle
          toggleValue={settings.wifiOnly}
          onToggle={() => updateSetting('wifiOnly', !settings.wifiOnly)}
        />
      </motion.div>

      {/* About Group */}
      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="mx-5 mt-4 bg-white rounded-[20px] overflow-hidden"
      >
        <SettingRow
          icon={<HelpCircle size={18} className="text-[#1B2A4A]" />}
          label="Help & Support"
          sublabel="FAQs and contact us"
          onClick={() => setActiveSheet('help')}
        />
        <div className="h-px bg-[#E2E8F0] ml-16" />
        <SettingRow
          icon={<Shield size={18} className="text-[#1B2A4A]" />}
          label="Privacy Policy"
          onClick={() => setActiveSheet('privacy')}
        />
        <div className="h-px bg-[#E2E8F0] ml-16" />
        <SettingRow
          icon={<FileText size={18} className="text-[#1B2A4A]" />}
          label="Terms of Service"
          onClick={() => setActiveSheet('terms')}
        />
        <div className="h-px bg-[#E2E8F0] ml-16" />
        <SettingRow
          icon={<Star size={18} className="text-[#F26B3A]" />}
          label="Rate App"
          sublabel="Enjoying SaveClip? Leave a review"
          onClick={() => {
            window.open('https://apps.apple.com', '_blank');
            showToast('Thank you for rating SaveClip! ⭐');
          }}
        />
      </motion.div>

      {/* Danger Zone */}
      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mx-5 mt-4 bg-white rounded-[20px] overflow-hidden"
      >
        <SettingRow
          icon={<Trash2 size={18} className="text-[#FF3B30]" />}
          label="Clear All Downloads"
          danger
          chevron={false}
          onClick={() => setActiveSheet('clear')}
        />
      </motion.div>

      {/* Version Footer */}
      <div className="text-center pt-8 pb-4">
        <p className="text-[13px] text-[#6B7FA3]">SaveClip v2.1.0</p>
        <p className="text-[11px] text-[#A0AEC0] mt-1">Made with ❤️ for content lovers</p>
      </div>

      {/* ── Bottom Sheets ── */}
      <AnimatePresence>
        {activeSheet && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-[rgba(27,42,74,0.55)] flex items-end"
            onClick={() => setActiveSheet(null)}
          >
            <motion.div
              key="sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-full bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* ── Clear confirm ── */}
              {activeSheet === 'clear' && (
                <div className="p-6">
                  <div className="flex justify-center mb-4">
                    <div className="w-14 h-14 bg-[#FFF0EB] rounded-full flex items-center justify-center">
                      <AlertTriangle size={28} className="text-[#FF3B30]" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-[#1B2A4A] text-center mb-2">Clear All Downloads?</h3>
                  <p className="text-[15px] text-[#6B7FA3] text-center mb-6">
                    This will remove all {state.downloads.length} items from your history. This action cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <button onClick={() => setActiveSheet(null)}
                      className="flex-1 h-12 bg-[#F2F4F8] text-[#1B2A4A] text-sm font-semibold rounded-xl">
                      Cancel
                    </button>
                    <button onClick={handleClearDownloads}
                      className="flex-1 h-12 bg-[#FF3B30] text-white text-sm font-semibold rounded-xl">
                      Clear All
                    </button>
                  </div>
                </div>
              )}

              {/* ── Premium upgrade ── */}
              {activeSheet === 'premium' && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-xl font-bold text-[#1B2A4A]">Go Premium</h3>
                    <button onClick={() => setActiveSheet(null)} className="p-1">
                      <X size={22} className="text-[#6B7FA3]" />
                    </button>
                  </div>
                  <div className="bg-gradient-to-br from-[#F26B3A] to-[#FF9A5C] rounded-2xl p-5 mb-5 text-white text-center">
                    <Crown size={32} className="mx-auto mb-2" />
                    <p className="text-2xl font-bold mb-1">SaveClip Premium</p>
                    <p className="text-sm opacity-90">Everything, unlimited.</p>
                  </div>
                  {[
                    'Unlimited simultaneous downloads',
                    'No ads, ever',
                    '4K & 8K video quality',
                    'Background downloading',
                    'Priority support',
                  ].map((f) => (
                    <div key={f} className="flex items-center gap-3 py-2.5 border-b border-[#F2F4F8] last:border-0">
                      <div className="w-6 h-6 rounded-full bg-[#FFF0EB] flex items-center justify-center flex-shrink-0">
                        <Check size={13} className="text-[#F26B3A]" />
                      </div>
                      <span className="text-[15px] text-[#1B2A4A]">{f}</span>
                    </div>
                  ))}
                  <button
                    className="w-full mt-5 h-14 bg-gradient-to-r from-[#F26B3A] to-[#FF9A5C] text-white font-bold rounded-2xl text-[16px]"
                    onClick={() => { showToast('Premium coming soon!'); setActiveSheet(null); }}
                  >
                    Upgrade — $4.99 / month
                  </button>
                </div>
              )}

              {/* ── Help & Support ── */}
              {activeSheet === 'help' && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-xl font-bold text-[#1B2A4A]">Help & Support</h3>
                    <button onClick={() => setActiveSheet(null)} className="p-1">
                      <X size={22} className="text-[#6B7FA3]" />
                    </button>
                  </div>
                  {[
                    { q: 'How do I download a video?', a: 'Paste any supported URL into the search bar on the Home tab. SaveClip will automatically detect the platform and let you choose your format and quality.' },
                    { q: 'Which platforms are supported?', a: 'YouTube, TikTok, Instagram, Twitter/X, Facebook, Reddit, and SoundCloud.' },
                    { q: 'Why is my download failing?', a: 'Make sure the URL is correct and the video is publicly accessible. Private or restricted videos cannot be downloaded.' },
                    { q: 'Where are my downloads saved?', a: 'Downloads appear in the Downloads tab once complete. Tap the save button to save the file to your device.' },
                  ].map(({ q, a }) => (
                    <div key={q} className="mb-4 bg-[#F2F4F8] rounded-2xl p-4">
                      <p className="text-[14px] font-semibold text-[#1B2A4A] mb-1">{q}</p>
                      <p className="text-[13px] text-[#6B7FA3] leading-relaxed">{a}</p>
                    </div>
                  ))}
                  <a
                    href="mailto:support@saveclip.app"
                    className="w-full mt-2 h-12 bg-[#F2F4F8] text-[#1B2A4A] text-sm font-semibold rounded-xl flex items-center justify-center gap-2"
                  >
                    <Mail size={16} />
                    Email Support
                  </a>
                  <a
                    href="mailto:support@saveclip.app?subject=SaveClip%20Feedback"
                    className="w-full mt-3 h-12 bg-[#F26B3A] text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2"
                  >
                    <MessageCircle size={16} />
                    Send Feedback
                  </a>
                </div>
              )}

              {/* ── Privacy Policy ── */}
              {activeSheet === 'privacy' && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-xl font-bold text-[#1B2A4A]">Privacy Policy</h3>
                    <button onClick={() => setActiveSheet(null)} className="p-1">
                      <X size={22} className="text-[#6B7FA3]" />
                    </button>
                  </div>
                  <p className="text-[12px] text-[#A0AEC0] mb-4">Last updated: January 1, 2025</p>
                  {[
                    { title: 'Data We Collect', body: 'SaveClip stores your download history and preferences locally on your device. We do not collect, transmit, or sell any personal data to third parties.' },
                    { title: 'How We Use Your Data', body: 'Your data is used solely to provide and improve the SaveClip experience — remembering your settings and download history between sessions.' },
                    { title: 'Third-Party Services', body: 'SaveClip fetches video metadata and content directly from the platforms you request. Please review the respective platform\'s privacy policy for their data practices.' },
                    { title: 'Data Retention', body: 'All data is stored locally. You can clear your download history at any time via Settings → Clear All Downloads.' },
                    { title: 'Contact', body: 'Questions about privacy? Email us at privacy@saveclip.app.' },
                  ].map(({ title, body }) => (
                    <div key={title} className="mb-4">
                      <p className="text-[14px] font-semibold text-[#1B2A4A] mb-1">{title}</p>
                      <p className="text-[13px] text-[#6B7FA3] leading-relaxed">{body}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Terms of Service ── */}
              {activeSheet === 'terms' && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-xl font-bold text-[#1B2A4A]">Terms of Service</h3>
                    <button onClick={() => setActiveSheet(null)} className="p-1">
                      <X size={22} className="text-[#6B7FA3]" />
                    </button>
                  </div>
                  <p className="text-[12px] text-[#A0AEC0] mb-4">Last updated: January 1, 2025</p>
                  {[
                    { title: 'Acceptable Use', body: 'SaveClip is intended for downloading content you have the legal right to access. You agree not to use SaveClip to infringe copyrights or violate the terms of any platform.' },
                    { title: 'Personal Use Only', body: 'Downloaded content is for personal, non-commercial use only. Redistribution or republishing of downloaded content is strictly prohibited.' },
                    { title: 'No Warranty', body: 'SaveClip is provided "as is" without warranty of any kind. We are not liable for interruptions in service or failure to download specific content.' },
                    { title: 'Platform Compliance', body: 'Use of SaveClip must comply with the terms of service of the platforms from which content is downloaded (YouTube, TikTok, Instagram, etc.).' },
                    { title: 'Changes to Terms', body: 'We may update these terms at any time. Continued use of SaveClip constitutes acceptance of the updated terms.' },
                    { title: 'Contact', body: 'For legal inquiries, contact legal@saveclip.app.' },
                  ].map(({ title, body }) => (
                    <div key={title} className="mb-4">
                      <p className="text-[14px] font-semibold text-[#1B2A4A] mb-1">{title}</p>
                      <p className="text-[13px] text-[#6B7FA3] leading-relaxed">{body}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
