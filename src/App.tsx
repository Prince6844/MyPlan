import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { MobileFrame } from './components/common/MobileFrame';
import { Toast } from './components/common/Toast';
import { NotificationBanner } from './components/common/NotificationBanner';

// Screens
import { SplashScreen } from './components/screens/SplashScreen';
import { OnboardingScreen } from './components/screens/OnboardingScreen';
import { HomeScreen } from './components/screens/HomeScreen';
import { AddTaskModal } from './components/screens/AddTaskModal';
import { CalendarScreen } from './components/screens/CalendarScreen';
import { TaskDetailsModal } from './components/screens/TaskDetailsModal';
import { SettingsScreen } from './components/screens/SettingsScreen';
import { CategoryModal } from './components/screens/CategoryModal';
import { NightReviewModal } from './components/screens/NightReviewModal';
import { LockScreenSimulator } from './components/screens/LockScreenSimulator';
import { StatsScreen } from './components/screens/StatsScreen';

const MainScreenRouter: React.FC = () => {
  const { 
    activeScreen, 
    settings, 
    tasks, 
    activeDate, 
    testMorningNotification, 
    testNightNotification 
  } = useApp();

  // Background timer to check morning and night review times
  useEffect(() => {
    const checkScheduledTimes = () => {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();

      // Convert "07:00 AM" to 24h
      const parseTimeTo24h = (timeStr: string) => {
        const [time, period] = timeStr.split(' ');
        let [h, m] = time.split(':').map(Number);
        if (period === 'PM' && h < 12) h += 12;
        if (period === 'AM' && h === 12) h = 0;
        return { h, m };
      };

      if (settings.morning_notification_enabled) {
        const morning = parseTimeTo24h(settings.morning_notification_time);
        if (currentHours === morning.h && currentMinutes === morning.m) {
          testMorningNotification();
        }
      }

      if (settings.night_notification_enabled) {
        const night = parseTimeTo24h(settings.night_notification_time);
        if (currentHours === night.h && currentMinutes === night.m) {
          testNightNotification();
        }
      }
    };

    const interval = setInterval(checkScheduledTimes, 60000); // check every minute
    return () => clearInterval(interval);
  }, [settings, tasks, activeDate, testMorningNotification, testNightNotification]);

  // Screen selection
  const renderScreen = () => {
    switch (activeScreen) {
      case 'splash':
        return <SplashScreen />;
      case 'onboarding':
        return <OnboardingScreen />;
      case 'home':
        return <HomeScreen />;
      case 'add_task':
        return <AddTaskModal />;
      case 'calendar':
        return <CalendarScreen />;
      case 'task_details':
        return <TaskDetailsModal />;
      case 'settings':
        return <SettingsScreen />;
      case 'categories':
        return <CategoryModal />;
      case 'night_review':
        return <NightReviewModal />;
      case 'simulator':
        return <LockScreenSimulator />;
      case 'stats':
        return <StatsScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <>
      <Toast />
      <NotificationBanner />
      {renderScreen()}
    </>
  );
};

export function App() {
  return (
    <AppProvider>
      <MobileFrame>
        <MainScreenRouter />
      </MobileFrame>
    </AppProvider>
  );
}

export default App;
