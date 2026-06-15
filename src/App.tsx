import { useEffect } from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import BottomNav from '@/components/BottomNav';
import Toast from '@/components/Toast';
import DownloadSheet from '@/components/DownloadSheet';
import Home from '@/pages/Home';
import Downloads from '@/pages/Downloads';
import Formats from '@/pages/Formats';
import Settings from '@/pages/Settings';
import Onboarding from '@/pages/Onboarding';

function AppContent() {
  const { state } = useApp();

  useEffect(() => {
    if (state.settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.settings.darkMode]);

  // Show onboarding if user hasn't seen it
  if (!state.hasSeenOnboarding) {
    return <Onboarding />;
  }

  const renderPage = () => {
    switch (state.currentTab) {
      case 'home':
        return <Home />;
      case 'downloads':
        return <Downloads />;
      case 'formats':
        return <Formats />;
      case 'settings':
        return <Settings />;
      default:
        return <Home />;
    }
  };

  return (
    <div className="h-screen w-full bg-[#F2F4F8] overflow-hidden">
      <div className="h-full w-full max-w-[430px] mx-auto relative overflow-y-auto no-scrollbar">
        {renderPage()}
      </div>
      <BottomNav />
      <Toast />
      <DownloadSheet />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}
