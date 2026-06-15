import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Check, Clock, MoreHorizontal, Trash2, Share2, FileText } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import type { DownloadItem } from '@/types';
import PlatformIcon from '@/components/PlatformIcon';


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

type FilterTab = 'all' | 'video' | 'audio';

export default function Downloads() {
  const { state, dispatch, showToast } = useApp();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  const filteredDownloads = state.downloads
    .filter((d) => {
      if (activeFilter === 'video') return d.format === 'video';
      if (activeFilter === 'audio') return d.format === 'audio';
      return true;
    })
    .filter((d) => {
      if (!searchQuery) return true;
      return d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.platform.toLowerCase().includes(searchQuery.toLowerCase());
    });

  const handleDelete = (id: string) => {
    dispatch({ type: 'DELETE_DOWNLOAD', id });
    setActionMenuId(null);
    showToast('Download deleted');
  };

  const handleShare = (item: DownloadItem) => {
    if (navigator.share) {
      navigator.share({
        title: item.title,
        text: `Check out this download: ${item.title}`,
        url: item.url,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(item.url).then(() => showToast('Link copied!'));
    }
    setActionMenuId(null);
  };

  return (
    <div className="min-h-full pb-28">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-5 pt-3 pb-2">
        <h1 className="text-[28px] font-bold text-[#1B2A4A]">My Downloads</h1>
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="p-2 active:opacity-60 transition-opacity"
        >
          {searchOpen ? <X size={22} className="text-[#1B2A4A]" /> : <Search size={22} className="text-[#1B2A4A]" />}
        </button>
      </div>

      {/* Search Bar */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="px-5 overflow-hidden"
          >
            <div className="flex items-center bg-white rounded-xl px-4 h-12 border border-[#E2E8F0]">
              <Search size={18} className="text-[#6B7FA3] flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search downloads…"
                className="flex-1 ml-3 text-[15px] text-[#1B2A4A] placeholder:text-[#6B7FA3] bg-transparent outline-none"
                autoFocus
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')}>
                  <X size={16} className="text-[#6B7FA3]" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Tabs */}
      <div className="flex gap-3 px-5 pt-4">
        {(['all', 'video', 'audio'] as FilterTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={`h-9 px-5 rounded-xl text-sm font-semibold transition-all ${
              activeFilter === tab
                ? 'bg-[#1B2A4A] text-white'
                : 'text-[#6B7FA3] font-medium'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Download List */}
      <div className="px-5 pt-4">
        <AnimatePresence mode="wait">
          {filteredDownloads.length > 0 ? (
            <motion.div
              key={activeFilter + searchQuery}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="divide-y divide-[#E2E8F0]"
            >
              {filteredDownloads.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: idx * 0.04 }}
                  className="flex items-center gap-3 py-3.5 active:bg-[#F7F9FC] transition-colors -mx-2 px-2 rounded-xl relative"
                >
                  <div className="w-14 h-14 bg-gray-200 rounded-xl flex-shrink-0 overflow-hidden">
                    {item.thumbnail && (
                      <img
                        src={item.thumbnail}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] text-[#1B2A4A] truncate">{item.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <PlatformIcon platform={item.platform} size={12} />
                      <span className="text-[12px] text-[#6B7FA3]">
                        {platformNames[item.platform] || 'Unknown'}
                      </span>
                      <span className="text-[12px] text-[#6B7FA3]">·</span>
                      <span className="text-[12px] text-[#6B7FA3]">{item.fileSize}</span>
                      <span className="text-[12px] text-[#6B7FA3]">·</span>
                      <span className="text-[12px] text-[#6B7FA3]">
                        {new Date(item.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.status === 'completed' ? (
                      <Check size={16} className="text-[#34C759]" />
                    ) : (
                      <Clock size={16} className="text-[#FF9500]" />
                    )}
                    <button
                      onClick={() => setActionMenuId(actionMenuId === item.id ? null : item.id)}
                      className="p-1"
                    >
                      <MoreHorizontal size={18} className="text-[#6B7FA3]" />
                    </button>
                  </div>

                  {/* Action Menu Dropdown */}
                  <AnimatePresence>
                    {actionMenuId === item.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute right-2 top-12 bg-white rounded-xl shadow-floating border border-[#E2E8F0] py-1 z-10 min-w-[140px]"
                      >
                        <button
                          onClick={() => handleShare(item)}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[14px] text-[#1B2A4A] hover:bg-[#F7F9FC]"
                        >
                          <Share2 size={16} />
                          Share
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(item.title);
                            showToast('Title copied!');
                            setActionMenuId(null);
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[14px] text-[#1B2A4A] hover:bg-[#F7F9FC]"
                        >
                          <FileText size={16} />
                          Copy Title
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[14px] text-[#FF3B30] hover:bg-[#FFF0EB]"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center pt-16"
            >
              <img
                src="/images/empty-mascot.png"
                alt="No downloads"
                className="w-36 h-36 object-contain"
              />
              <h2 className="text-[22px] font-bold text-[#1B2A4A] mt-4">No downloads yet</h2>
              <p className="text-[15px] text-[#6B7FA3] text-center mt-2 px-8">
                Your downloaded videos and audio will appear here
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
