export type Tab = 'home' | 'downloads' | 'formats' | 'settings';

export type Platform = 'youtube' | 'tiktok' | 'instagram' | 'twitter' | 'facebook' | 'reddit' | 'soundcloud' | 'unknown';

export type DownloadFormat = 'video' | 'audio';

export type VideoQuality = '720p' | '1080p' | '4K';

export type DownloadStatus = 'pending' | 'analyzing' | 'downloading' | 'saving' | 'completed' | 'failed';

export interface DownloadItem {
  id: string;
  url: string;
  title: string;
  platform: Platform;
  thumbnail: string;
  duration: string;
  format: DownloadFormat;
  quality: VideoQuality;
  fileSize: string;
  downloadedSize: string;
  progress: number;
  status: DownloadStatus;
  date: string;
}

export interface AppSettings {
  defaultFormat: DownloadFormat;
  defaultQuality: VideoQuality;
  saveLocation: string;
  autoDownload: boolean;
  notifications: boolean;
  darkMode: boolean;
  wifiOnly: boolean;
}

export interface AppState {
  currentTab: Tab;
  downloads: DownloadItem[];
  settings: AppSettings;
  hasSeenOnboarding: boolean;
  toast: { message: string; visible: boolean } | null;
  activeDownload: DownloadItem | null;
  showDownloadSheet: boolean;
}
