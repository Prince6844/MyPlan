import React from 'react';
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
  const { activeScreen } = useApp();

  // Screen selection
  const renderScreen = () => {
    switch (activeScreen) {
      case 'splash':
        return <SplashScreen />;
      case 'onboarding':
        return <OnboardingScreen />;
      case 'home':
        return <HomeScreen view="dashboard" />;
      case 'tasks':
        return <HomeScreen view="tasks" />;
      case 'completed':
        return <HomeScreen view="completed" />;
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
        return <HomeScreen view="dashboard" />;
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
