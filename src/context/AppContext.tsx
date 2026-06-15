import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type { Tab, DownloadItem, AppSettings, AppState, DownloadFormat, VideoQuality, Platform } from '@/types';

const API_BASE = import.meta.env.VITE_API_URL || '';

type Action =
  | { type: 'SET_TAB'; tab: Tab }
  | { type: 'ADD_DOWNLOAD'; item: DownloadItem }
  | { type: 'UPDATE_DOWNLOAD'; id: string; updates: Partial<DownloadItem> }
  | { type: 'SET_DOWNLOADS'; downloads: DownloadItem[] }
  | { type: 'DELETE_DOWNLOAD'; id: string }
  | { type: 'CLEAR_DOWNLOADS' }
  | { type: 'UPDATE_SETTINGS'; settings: Partial<AppSettings> }
  | { type: 'COMPLETE_ONBOARDING' }
  | { type: 'SHOW_TOAST'; message: string }
  | { type: 'HIDE_TOAST' }
  | { type: 'START_DOWNLOAD'; item: DownloadItem }
  | { type: 'UPDATE_PROGRESS'; progress: number; status: DownloadItem['status']; downloadedSize: string }
  | { type: 'COMPLETE_ACTIVE_DOWNLOAD'; downloadUrl?: string }
  | { type: 'FAIL_ACTIVE_DOWNLOAD'; error: string }
  | { type: 'SHOW_DOWNLOAD_SHEET'; show: boolean }
  | { type: 'RESET_ACTIVE_DOWNLOAD' }
  | { type: 'SET_BACKEND_AVAILABLE'; available: boolean };

const defaultSettings: AppSettings = {
  defaultFormat: 'video',
  defaultQuality: '1080p',
  saveLocation: '/storage/Downloads/SaveClip',
  autoDownload: false,
  notifications: true,
  darkMode: false,
  wifiOnly: true,
};

const loadState = (): Partial<AppState> => {
  try {
    const saved = localStorage.getItem('saveclip_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        downloads: parsed.downloads || [],
        settings: { ...defaultSettings, ...parsed.settings },
        hasSeenOnboarding: parsed.hasSeenOnboarding || false,
      };
    }
  } catch { /* ignore */ }
  return {};
};

const initialState: AppState = {
  currentTab: 'home',
  downloads: [],
  settings: defaultSettings,
  hasSeenOnboarding: false,
  toast: null,
  activeDownload: null,
  showDownloadSheet: false,
  ...loadState(),
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_TAB': return { ...state, currentTab: action.tab };
    case 'ADD_DOWNLOAD': return { ...state, downloads: [action.item, ...state.downloads] };
    case 'UPDATE_DOWNLOAD':
      return {
        ...state,
        downloads: state.downloads.map(d => d.id === action.id ? { ...d, ...action.updates } : d),
      };
    case 'SET_DOWNLOADS': return { ...state, downloads: action.downloads };
    case 'DELETE_DOWNLOAD': return { ...state, downloads: state.downloads.filter(d => d.id !== action.id) };
    case 'CLEAR_DOWNLOADS': return { ...state, downloads: [] };
    case 'UPDATE_SETTINGS': return { ...state, settings: { ...state.settings, ...action.settings } };
    case 'COMPLETE_ONBOARDING': return { ...state, hasSeenOnboarding: true };
    case 'SHOW_TOAST': return { ...state, toast: { message: action.message, visible: true } };
    case 'HIDE_TOAST': return { ...state, toast: null };
    case 'START_DOWNLOAD':
      return {
        ...state,
        activeDownload: action.item,
        showDownloadSheet: true,
        downloads: [action.item, ...state.downloads],
      };
    case 'UPDATE_PROGRESS': {
      if (!state.activeDownload) return state;
      const updated = { ...state.activeDownload, progress: action.progress, status: action.status, downloadedSize: action.downloadedSize };
      return {
        ...state,
        activeDownload: updated,
        downloads: state.downloads.map(d => d.id === updated.id ? updated : d),
      };
    }
    case 'COMPLETE_ACTIVE_DOWNLOAD': {
      if (!state.activeDownload) return state;
      const completed = {
        ...state.activeDownload,
        progress: 100,
        status: 'completed' as const,
        downloadedSize: state.activeDownload.fileSize,
      };
      return {
        ...state,
        activeDownload: completed,
        downloads: state.downloads.map(d => d.id === completed.id ? completed : d),
        toast: { message: 'Download ready! Tap "Save to Device" to save.', visible: true },
      };
    }
    case 'FAIL_ACTIVE_DOWNLOAD': {
      if (!state.activeDownload) return state;
      const failed = { ...state.activeDownload, progress: 0, status: 'failed' as const };
      return {
        ...state,
        activeDownload: failed,
        downloads: state.downloads.map(d => d.id === failed.id ? failed : d),
        toast: { message: action.error, visible: true },
      };
    }
    case 'SHOW_DOWNLOAD_SHEET': return { ...state, showDownloadSheet: action.show };
    case 'RESET_ACTIVE_DOWNLOAD': return { ...state, activeDownload: null, showDownloadSheet: false };
    default: return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  setTab: (tab: Tab) => void;
  showToast: (message: string) => void;
  detectPlatform: (url: string) => Platform;
  analyzeUrl: (url: string) => Promise<{ title: string; thumbnail: string; duration: string; uploader: string; platform: Platform; formats: string[]; qualities: string[]; fileSize: string } | null>;
  startDownload: (url: string, title: string, thumbnail: string, duration: string, platform: Platform, format: DownloadFormat, quality: VideoQuality, fileSize: string) => Promise<void>;
  downloadFile: (item: DownloadItem) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const toSave = {
      downloads: state.downloads,
      settings: state.settings,
      hasSeenOnboarding: state.hasSeenOnboarding,
    };
    localStorage.setItem('saveclip_state', JSON.stringify(toSave));
  }, [state.downloads, state.settings, state.hasSeenOnboarding]);

  useEffect(() => {
    if (state.toast?.visible) {
      const timer = setTimeout(() => dispatch({ type: 'HIDE_TOAST' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [state.toast]);

  const setTab = useCallback((tab: Tab) => dispatch({ type: 'SET_TAB', tab }), []);
  const showToast = useCallback((message: string) => dispatch({ type: 'SHOW_TOAST', message }), []);

  const detectPlatform = useCallback((url: string): Platform => {
    const lower = url.toLowerCase();
    if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
    if (lower.includes('tiktok.com')) return 'tiktok';
    if (lower.includes('instagram.com')) return 'instagram';
    if (lower.includes('twitter.com') || lower.includes('x.com')) return 'twitter';
    if (lower.includes('facebook.com') || lower.includes('fb.watch')) return 'facebook';
    if (lower.includes('reddit.com')) return 'reddit';
    if (lower.includes('soundcloud.com')) return 'soundcloud';
    return 'unknown';
  }, []);

  const analyzeUrl = useCallback(async (url: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
        signal: AbortSignal.timeout(12000),
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.success) {
        return {
          title: data.title,
          thumbnail: data.thumbnail,
          duration: data.duration,
          uploader: data.uploader || '',
          platform: data.platform as Platform,
          formats: data.formats,
          qualities: data.qualities,
          fileSize: data.fileSize,
        };
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  // Trigger real browser download via direct-stream endpoint
  const downloadFile = useCallback((item: DownloadItem) => {
    const params = new URLSearchParams({
      url: item.url,
      format: item.format || 'video',
      quality: item.quality || '720p',
      title: item.title || 'video',
    });
    const link = document.createElement('a');
    link.href = `${API_BASE}/api/direct-download?${params}`;
    link.download = item.title || 'video';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const startDownload = useCallback(async (
    url: string,
    title: string,
    thumbnail: string,
    duration: string,
    platform: Platform,
    format: DownloadFormat,
    quality: VideoQuality,
    fileSize: string
  ) => {
    const id = Date.now().toString();
    const item: DownloadItem = {
      id, url, title, platform, thumbnail, duration,
      format, quality, fileSize,
      downloadedSize: '0 MB',
      progress: 0,
      status: 'analyzing',
      date: new Date().toISOString(),
    };

    dispatch({ type: 'START_DOWNLOAD', item });

    // Step 1: Animate through analyzing → downloading → saving
    const steps = [
      { progress: 15, downloadedSize: '0 MB', status: 'analyzing' as const, delay: 600 },
      { progress: 35, downloadedSize: '0 MB', status: 'downloading' as const, delay: 1400 },
      { progress: 60, downloadedSize: '0 MB', status: 'downloading' as const, delay: 2400 },
      { progress: 80, downloadedSize: '0 MB', status: 'downloading' as const, delay: 3200 },
      { progress: 90, downloadedSize: '0 MB', status: 'saving' as const, delay: 4000 },
    ];

    steps.forEach(({ progress, downloadedSize, status, delay }) => {
      setTimeout(() => {
        dispatch({ type: 'UPDATE_PROGRESS', progress, status, downloadedSize });
      }, delay);
    });

    // Step 2: Complete after short animation, then trigger real download
    setTimeout(() => {
      dispatch({ type: 'COMPLETE_ACTIVE_DOWNLOAD' });
      // Auto-trigger the actual file download
      const params = new URLSearchParams({ url, format, quality, title: title || 'video' });
      const link = document.createElement('a');
      link.href = `${API_BASE}/api/direct-download?${params}`;
      link.download = title || 'video';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 4800);

  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch, setTab, showToast, detectPlatform, analyzeUrl, startDownload, downloadFile }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
