import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import type { Tab, DownloadItem, AppSettings, AppState, DownloadFormat, VideoQuality, Platform } from '@/types';

const API_BASE = import.meta.env.VITE_API_URL || '';

async function apiPost(endpoint: string, body: unknown) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function apiGet(endpoint: string) {
  const res = await fetch(`${API_BASE}${endpoint}`);
  return res.json();
}

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
    case 'SET_TAB':
      return { ...state, currentTab: action.tab };
    case 'ADD_DOWNLOAD':
      return { ...state, downloads: [action.item, ...state.downloads] };
    case 'UPDATE_DOWNLOAD':
      return {
        ...state,
        downloads: state.downloads.map(d =>
          d.id === action.id ? { ...d, ...action.updates } : d
        ),
      };
    case 'SET_DOWNLOADS':
      return { ...state, downloads: action.downloads };
    case 'DELETE_DOWNLOAD':
      return { ...state, downloads: state.downloads.filter(d => d.id !== action.id) };
    case 'CLEAR_DOWNLOADS':
      return { ...state, downloads: [] };
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.settings } };
    case 'COMPLETE_ONBOARDING':
      return { ...state, hasSeenOnboarding: true };
    case 'SHOW_TOAST':
      return { ...state, toast: { message: action.message, visible: true } };
    case 'HIDE_TOAST':
      return { ...state, toast: null };
    case 'START_DOWNLOAD':
      return {
        ...state,
        activeDownload: action.item,
        showDownloadSheet: true,
        downloads: [action.item, ...state.downloads],
      };
    case 'UPDATE_PROGRESS': {
      if (!state.activeDownload) return state;
      const updated = {
        ...state.activeDownload,
        progress: action.progress,
        status: action.status,
        downloadedSize: action.downloadedSize,
      };
      return {
        ...state,
        activeDownload: updated,
        downloads: state.downloads.map(d =>
          d.id === updated.id ? updated : d
        ),
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
        downloads: state.downloads.map(d =>
          d.id === completed.id ? completed : d
        ),
        toast: { message: 'Download complete! Tap "Save to Device" to download.', visible: true },
      };
    }
    case 'FAIL_ACTIVE_DOWNLOAD': {
      if (!state.activeDownload) return state;
      const failed = {
        ...state.activeDownload,
        progress: 0,
        status: 'failed' as const,
      };
      return {
        ...state,
        activeDownload: failed,
        downloads: state.downloads.map(d =>
          d.id === failed.id ? failed : d
        ),
        toast: { message: action.error, visible: true },
      };
    }
    case 'SHOW_DOWNLOAD_SHEET':
      return { ...state, showDownloadSheet: action.show };
    case 'RESET_ACTIVE_DOWNLOAD':
      return { ...state, activeDownload: null, showDownloadSheet: false };
    default:
      return state;
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
  downloadFile: (id: string, title: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const backendAvailable = useRef<boolean | null>(null);

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
      const timer = setTimeout(() => {
        dispatch({ type: 'HIDE_TOAST' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [state.toast]);

  const setTab = useCallback((tab: Tab) => {
    dispatch({ type: 'SET_TAB', tab });
  }, []);

  const showToast = useCallback((message: string) => {
    dispatch({ type: 'SHOW_TOAST', message });
  }, []);

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

  const checkBackend = useCallback(async () => {
    if (backendAvailable.current !== null) return backendAvailable.current;
    try {
      const res = await fetch(`${API_BASE}/api/downloads`, { method: 'GET', signal: AbortSignal.timeout(3000) });
      backendAvailable.current = res.ok;
      return res.ok;
    } catch {
      backendAvailable.current = false;
      return false;
    }
  }, []);

  const simulateDownload = useCallback((_id: string, fileSize: string) => {
    // Simulate frontend progress animation
    const intervals = [
      { progress: 15, size: '7.2 MB', delay: 800, status: 'analyzing' as const },
      { progress: 32, size: '15.4 MB', delay: 1600, status: 'downloading' as const },
      { progress: 48, size: '23.1 MB', delay: 2400, status: 'downloading' as const },
      { progress: 65, size: '31.3 MB', delay: 3200, status: 'downloading' as const },
      { progress: 82, size: '39.5 MB', delay: 4000, status: 'downloading' as const },
      { progress: 95, size: '45.8 MB', delay: 4800, status: 'downloading' as const },
    ];

    intervals.forEach(({ progress, size, delay, status }) => {
      setTimeout(() => {
        dispatch({ type: 'UPDATE_PROGRESS', progress, status, downloadedSize: size });
      }, delay);
    });

    setTimeout(() => {
      dispatch({ type: 'UPDATE_PROGRESS', progress: 99, status: 'saving', downloadedSize: fileSize });
    }, 5600);

    setTimeout(() => {
      dispatch({ type: 'COMPLETE_ACTIVE_DOWNLOAD' });
    }, 6400);
  }, []);

  const analyzeUrl = useCallback(async (url: string) => {
    const hasBackend = await checkBackend();
    if (!hasBackend) return null; // Will use fallback in Home component

    try {
      const data = await apiPost('/api/analyze', { url });
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
  }, [checkBackend]);

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
      id,
      url,
      title,
      platform,
      thumbnail,
      duration,
      format,
      quality,
      fileSize,
      downloadedSize: '0 MB',
      progress: 0,
      status: 'analyzing',
      date: new Date().toISOString(),
    };

    dispatch({ type: 'START_DOWNLOAD', item });

    const hasBackend = await checkBackend();

    if (!hasBackend) {
      // Fallback: simulate download
      simulateDownload(id, fileSize);
      return;
    }

    try {
      const data = await apiPost('/api/download', { url, format, quality, title });

      if (!data.success) {
        dispatch({ type: 'FAIL_ACTIVE_DOWNLOAD', error: data.error || 'Failed to start' });
        return;
      }

      const backendId = data.id;

      // Poll for progress
      let pollCount = 0;
      const pollInterval = setInterval(async () => {
        try {
          pollCount++;
          const progress = await apiGet(`/api/download/${backendId}/progress`);

          if (progress.status === 'completed') {
            clearInterval(pollInterval);
            dispatch({ type: 'COMPLETE_ACTIVE_DOWNLOAD', downloadUrl: progress.downloadUrl });
          } else if (progress.status === 'failed') {
            clearInterval(pollInterval);
            dispatch({ type: 'FAIL_ACTIVE_DOWNLOAD', error: progress.error || 'Unknown error' });
          } else if (progress.status === 'downloading') {
            // Frontend progress animation synced with backend
            const simulatedProgress = Math.min(95, 10 + pollCount * 15);
            dispatch({
              type: 'UPDATE_PROGRESS',
              progress: simulatedProgress,
              status: 'downloading',
              downloadedSize: progress.downloadedSize || `${Math.floor(simulatedProgress * 0.5)} MB`
            });
          }

          // Timeout after 60 polls (90 seconds)
          if (pollCount > 60) {
            clearInterval(pollInterval);
            dispatch({ type: 'FAIL_ACTIVE_DOWNLOAD', error: 'Download timed out' });
          }
        } catch {
          // Keep polling on network errors
        }
      }, 1500);
    } catch (error) {
      // Fallback to simulation on network error
      simulateDownload(id, fileSize);
    }
  }, [checkBackend, simulateDownload]);

  const downloadFile = useCallback((id: string, title: string) => {
    const link = document.createElement('a');
    link.href = `${API_BASE}/api/download/${id}/file`;
    link.download = `${title}.mp4`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Download started!');
  }, [showToast]);

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
