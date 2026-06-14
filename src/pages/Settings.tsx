import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown, Cloud, Bell, Moon, Wifi, HelpCircle, Shield, FileText, Star, Trash2,
  ChevronRight, AlertTriangle
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface SettingRowProps {
  icon: React.ReactNode;
  label: string;
  badge?: React.ReactNode;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: () => void;
  onClick?: () => void;
  danger?: boolean;
}

function SettingRow({ icon, label, badge, toggle, toggleValue, onToggle, onClick, danger }: SettingRowProps) {
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
      <span className={`flex-1 text-[15px] ${danger ? 'text-[#FF3B30]' : 'text-[#1B2A4A]'}`}>{label}</span>
      {badge}
      {toggle !== undefined && (
        <div
          className={`relative w-[52px] h-8 rounded-full transition-colors duration-200 ${
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
      {toggle === undefined && !badge && <ChevronRight size={18} className="text-[#A0AEC0]" />}
    </button>
  );
}

export default function Settings() {
  const { state, dispatch, showToast } = useApp();
  const { settings } = state;
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const updateSetting = (key: keyof typeof settings, value: boolean | string) => {
    dispatch({ type: 'UPDATE_SETTINGS', settings: { [key]: value } });
  };

  const handleClearDownloads = () => {
    dispatch({ type: 'CLEAR_DOWNLOADS' });
    setShowClearConfirm(false);
    showToast('All downloads cleared');
  };

  return (
    <div className="min-h-full pb-28">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-5 pt-3 pb-2">
        <h1 className="text-[28px] font-bold text-[#1B2A4A]">Settings</h1>
        <div className="w-9 h-9 bg-[#F2F4F8] rounded-full flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1B2A4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
      </div>

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
          badge={
            <span className="text-[11px] font-semibold text-[#F26B3A] bg-[#FFF0EB] px-2.5 py-1 rounded-lg">
              FREE
            </span>
          }
        />
        <div className="h-px bg-[#E2E8F0] ml-16" />
        <SettingRow
          icon={<Cloud size={18} className="text-[#1B2A4A]" />}
          label="Storage Used"
          badge={
            <span className="text-[12px] text-[#6B7FA3]">2.1 GB / 16 GB</span>
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
          toggle
          toggleValue={settings.notifications}
          onToggle={() => updateSetting('notifications', !settings.notifications)}
        />
        <div className="h-px bg-[#E2E8F0] ml-16" />
        <SettingRow
          icon={<Moon size={18} className="text-[#1B2A4A]" />}
          label="Dark Mode"
          toggle
          toggleValue={settings.darkMode}
          onToggle={() => updateSetting('darkMode', !settings.darkMode)}
        />
        <div className="h-px bg-[#E2E8F0] ml-16" />
        <SettingRow
          icon={<Wifi size={18} className="text-[#1B2A4A]" />}
          label="Download Over Wi-Fi Only"
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
        />
        <div className="h-px bg-[#E2E8F0] ml-16" />
        <SettingRow
          icon={<Shield size={18} className="text-[#1B2A4A]" />}
          label="Privacy Policy"
        />
        <div className="h-px bg-[#E2E8F0] ml-16" />
        <SettingRow
          icon={<FileText size={18} className="text-[#1B2A4A]" />}
          label="Terms of Service"
        />
        <div className="h-px bg-[#E2E8F0] ml-16" />
        <SettingRow
          icon={<Star size={18} className="text-[#1B2A4A]" />}
          label="Rate App"
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
          onClick={() => setShowClearConfirm(true)}
        />
      </motion.div>

      {/* Version Footer */}
      <div className="text-center pt-8 pb-4">
        <p className="text-[13px] text-[#6B7FA3]">SaveClip v2.1.0</p>
        <p className="text-[11px] text-[#6B7FA3] mt-1">Made with ❤️</p>
      </div>

      {/* Clear Confirmation Sheet */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-[rgba(27,42,74,0.55)] flex items-end"
            onClick={() => setShowClearConfirm(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-full bg-white rounded-t-3xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 bg-[#FFF0EB] rounded-full flex items-center justify-center">
                  <AlertTriangle size={28} className="text-[#FF3B30]" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-[#1B2A4A] text-center mb-2">Clear All Downloads?</h3>
              <p className="text-[15px] text-[#6B7FA3] text-center mb-6">
                This will remove all {state.downloads.length} downloaded items from your history. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 h-12 bg-[#F2F4F8] text-[#1B2A4A] text-sm font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearDownloads}
                  className="flex-1 h-12 bg-[#FF3B30] text-white text-sm font-semibold rounded-xl"
                >
                  Clear All
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
