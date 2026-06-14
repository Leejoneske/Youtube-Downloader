import { Home, Download, SlidersHorizontal, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import type { Tab } from '@/types';

const tabs: { key: Tab; label: string; icon: typeof Home }[] = [
  { key: 'home', label: 'Home', icon: Home },
  { key: 'downloads', label: 'Downloads', icon: Download },
  { key: 'formats', label: 'Formats', icon: SlidersHorizontal },
  { key: 'settings', label: 'Settings', icon: Settings },
];

export default function BottomNav() {
  const { state, setTab } = useApp();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E2E8F0] safe-bottom">
      <div className="max-w-[430px] mx-auto flex items-center justify-around h-16">
        {tabs.map((t) => {
          const isActive = state.currentTab === t.key;
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex flex-col items-center justify-center gap-0.5 w-16 h-full relative select-none"
            >
              <motion.div
                animate={{ scale: isActive ? 1 : 1, y: isActive ? -2 : 0 }}
                whileTap={{ scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15, duration: 0.12 }}
              >
                <Icon
                  size={24}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  className={isActive ? 'text-[#1B2A4A]' : 'text-[#A0AEC0]'}
                />
              </motion.div>
              <span
                className={`text-[11px] font-semibold ${
                  isActive ? 'text-[#1B2A4A]' : 'text-[#A0AEC0]'
                }`}
              >
                {t.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -bottom-0 w-5 h-1 bg-[#F26B3A] rounded-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
