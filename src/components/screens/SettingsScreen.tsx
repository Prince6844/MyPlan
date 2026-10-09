import React, { useState } from 'react';
import { 
  Bell, 
  Moon, 
  Volume2, 
  Globe, 
  Cloud, 
  ChevronRight, 
  FolderKanban,
  Check,
  Send,
  Clock,
  Sparkles
} from 'lucide-react';
import { TopBar } from '../common/TopBar';
import { BottomNavigation } from '../layout/BottomNavigation';
import { useApp } from '../../context/AppContext';
import { AuthModal } from './AuthModal';

export const SettingsScreen: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    setActiveScreen, 
    enablePushNotifications, 
    sendTestPush, 
    permissionStatus 
  } = useApp();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [editingTarget, setEditingTarget] = useState<'morning' | 'night' | 'reminder' | 'timezone' | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);

  const reminderOptions = [
    { label: 'At time of task', minutes: 0 },
    { label: '5 minutes before', minutes: 5 },
    { label: '10 minutes before', minutes: 10 },
    { label: '15 minutes before', minutes: 15 },
    { label: '30 minutes before', minutes: 30 },
    { label: '1 hour before', minutes: 60 },
  ];

  const commonTimezones = [
    { name: 'India Standard Time (IST)', value: 'Asia/Kolkata' },
    { name: 'Eastern Time (US / New York)', value: 'America/New_York' },
    { name: 'Pacific Time (US / Los Angeles)', value: 'America/Los_Angeles' },
    { name: 'Greenwich Mean Time (London)', value: 'Europe/London' },
    { name: 'Central European Time (Paris/Berlin)', value: 'Europe/Paris' },
    { name: 'Gulf Standard Time (Dubai)', value: 'Asia/Dubai' },
    { name: 'Singapore / Malaysia', value: 'Asia/Singapore' },
    { name: 'Japan Standard Time (Tokyo)', value: 'Asia/Tokyo' },
    { name: 'Australian Eastern (Sydney)', value: 'Australia/Sydney' },
  ];

  const handleEnablePush = async () => {
    setIsSubscribing(true);
    await enablePushNotifications();
    setIsSubscribing(false);
  };

  const handleSendTestPush = async () => {
    setIsSendingTest(true);
    await sendTestPush();
    setIsSendingTest(false);
  };

  const getStatusBadge = () => {
    switch (permissionStatus) {
      case 'Notifications enabled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            ● Notifications enabled
          </span>
        );
      case 'Notifications blocked':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            ✕ Notifications blocked
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            ○ Notifications not enabled
          </span>
        );
    }
  };

  return (
    <div className="relative w-full h-full min-h-[640px] flex flex-col justify-between bg-[#F8FAFC] dark:bg-slate-900 text-slate-800 dark:text-slate-100 animate-fade-in overflow-hidden select-none">
      <TopBar />

      <div className="flex-1 overflow-y-auto px-5 pt-2 pb-6 space-y-5 no-scrollbar">
        {/* Header */}
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white pt-1">
          Settings
        </h1>

        {/* SECTION 1: Notifications */}
        <div>
          <div className="flex items-center justify-between mb-2.5 px-1">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Notifications
            </h2>
            {getStatusBadge()}
          </div>

          {/* Enable Notifications Call to Action Button */}
          {permissionStatus !== 'Notifications enabled' && (
            <div className="mb-3 p-4 rounded-3xl bg-gradient-to-r from-blue-500 to-brand-600 text-white shadow-float flex flex-col items-start space-y-2">
              <div className="flex items-center space-x-2">
                <Sparkles size={16} className="text-amber-300" />
                <h3 className="text-xs font-extrabold uppercase tracking-wide">Stay Updated</h3>
              </div>
              <p className="text-xs text-blue-100 leading-snug">
                Receive real lock-screen morning briefs, night reviews, and task reminders on this device.
              </p>
              <button
                onClick={handleEnablePush}
                disabled={isSubscribing}
                className="mt-1 w-full py-2.5 rounded-2xl bg-white text-brand-600 font-extrabold text-xs shadow-md hover:bg-blue-50 transition-colors disabled:opacity-60"
              >
                {isSubscribing ? 'Subscribing Device...' : 'Enable Notifications'}
              </button>
            </div>
          )}

          <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-1.5 shadow-sm border border-slate-100 dark:border-slate-700/60 divide-y divide-slate-100 dark:divide-slate-700/50">
            {/* Morning Summary */}
            <div className="flex items-center justify-between p-3.5 px-3">
              <div 
                onClick={() => setEditingTarget('morning')}
                className="flex items-start space-x-3 cursor-pointer flex-1"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">🌅</span>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">Morning Summary</h3>
                  <span className="text-[11px] font-semibold text-slate-400">{settings.morning_summary_time}</span>
                </div>
              </div>

              <button
                onClick={() => updateSettings({ morning_summary_enabled: !settings.morning_summary_enabled })}
                className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                  settings.morning_summary_enabled ? 'bg-brand-500' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  settings.morning_summary_enabled ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Night Review */}
            <div className="flex items-center justify-between p-3.5 px-3">
              <div 
                onClick={() => setEditingTarget('night')}
                className="flex items-start space-x-3 cursor-pointer flex-1"
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500 flex items-center justify-center flex-shrink-0">
                  <Moon size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">Night Review</h3>
                  <span className="text-[11px] font-semibold text-slate-400">{settings.night_review_time}</span>
                </div>
              </div>

              <button
                onClick={() => updateSettings({ night_review_enabled: !settings.night_review_enabled })}
                className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                  settings.night_review_enabled ? 'bg-brand-500' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  settings.night_review_enabled ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Default Reminder */}
            <div 
              onClick={() => setEditingTarget('reminder')}
              className="flex items-center justify-between p-3.5 px-3 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors"
            >
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-brand-500 flex items-center justify-center flex-shrink-0">
                  <Bell size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">Default Reminder</h3>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {settings.default_reminder_minutes === 0 ? 'At time of task' : `${settings.default_reminder_minutes} minutes before`}
                  </span>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-300 dark:text-slate-600" />
            </div>

            {/* Timezone */}
            <div 
              onClick={() => setEditingTarget('timezone')}
              className="flex items-center justify-between p-3.5 px-3 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors"
            >
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 flex items-center justify-center flex-shrink-0">
                  <Clock size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">Timezone</h3>
                  <span className="text-[11px] font-semibold text-brand-600 dark:text-brand-400">{settings.timezone || 'Asia/Kolkata'}</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-300 dark:text-slate-600" />
            </div>

            {/* Send Test Notification Button */}
            <div className="p-3.5 px-3">
              <button
                onClick={handleSendTestPush}
                disabled={isSendingTest}
                className="w-full py-2.5 px-4 rounded-2xl bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/40 dark:hover:bg-brand-900/50 text-brand-600 dark:text-brand-300 border border-brand-200/80 dark:border-brand-800/60 font-bold text-xs flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
              >
                <Send size={14} className={isSendingTest ? 'animate-pulse' : ''} />
                <span>{isSendingTest ? 'Sending Real Push...' : 'Send Test Notification'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 2: App Settings */}
        <div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 px-1">
            App Settings
          </h2>

          <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-1.5 shadow-sm border border-slate-100 dark:border-slate-700/60 divide-y divide-slate-100 dark:divide-slate-700/50">
            {/* Dark Mode */}
            <div className="flex items-center justify-between p-3.5 px-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 flex items-center justify-center flex-shrink-0">
                  <Moon size={16} />
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-white">Dark Mode</span>
              </div>
              <button
                onClick={() => updateSettings({ dark_mode: !settings.dark_mode })}
                className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                  settings.dark_mode ? 'bg-brand-500' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  settings.dark_mode ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Sound */}
            <div className="flex items-center justify-between p-3.5 px-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 flex items-center justify-center flex-shrink-0">
                  <Volume2 size={16} />
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-white">Sound</span>
              </div>
              <button
                onClick={() => updateSettings({ sound_enabled: !settings.sound_enabled })}
                className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                  settings.sound_enabled ? 'bg-brand-500' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  settings.sound_enabled ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Language */}
            <div className="flex items-center justify-between p-3.5 px-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 flex items-center justify-center flex-shrink-0">
                  <Globe size={16} />
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-white">Language</span>
              </div>
              <div className="flex items-center space-x-1 text-slate-400 text-xs font-semibold">
                <span>{settings.language || 'English'}</span>
                <ChevronRight size={16} />
              </div>
            </div>

            {/* Backup & Sync */}
            <div 
              onClick={() => setShowAuthModal(true)}
              className="flex items-center justify-between p-3.5 px-3 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 flex items-center justify-center flex-shrink-0">
                  <Cloud size={16} />
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-white">Backup & Sync / Account</span>
              </div>
              <ChevronRight size={18} className="text-slate-300 dark:text-slate-600" />
            </div>

            {/* Manage Categories */}
            <div 
              onClick={() => setActiveScreen('categories')}
              className="flex items-center justify-between p-3.5 px-3 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-950/40 text-brand-500 flex items-center justify-center flex-shrink-0">
                  <FolderKanban size={16} />
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-white">Manage Categories</span>
              </div>
              <ChevronRight size={18} className="text-slate-300 dark:text-slate-600" />
            </div>
          </div>
        </div>
      </div>

      <BottomNavigation />

      {/* Editing Modal Sheets */}
      {editingTarget && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-xs z-50 flex flex-col justify-end animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-t-3xl p-5 shadow-modal max-h-[80%] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                {editingTarget === 'morning' && 'Configure Morning Summary Time'}
                {editingTarget === 'night' && 'Configure Night Review Time'}
                {editingTarget === 'reminder' && 'Default Reminder Minutes'}
                {editingTarget === 'timezone' && 'Select Your Timezone'}
              </h3>
              <button onClick={() => setEditingTarget(null)} className="text-xs font-semibold text-brand-500">
                Close
              </button>
            </div>

            <div className="py-4 space-y-2">
              {editingTarget === 'morning' && (
                <div className="grid grid-cols-3 gap-2">
                  {['06:00', '06:30', '07:00', '07:30', '08:00', '08:30'].map(time => (
                    <button
                      key={time}
                      onClick={() => {
                        updateSettings({ morning_summary_time: time });
                        setEditingTarget(null);
                      }}
                      className={`p-2.5 rounded-xl text-xs font-bold ${
                        settings.morning_summary_time === time ? 'bg-brand-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              )}

              {editingTarget === 'night' && (
                <div className="grid grid-cols-3 gap-2">
                  {['20:30', '21:00', '21:30', '22:00', '22:30', '23:00'].map(time => (
                    <button
                      key={time}
                      onClick={() => {
                        updateSettings({ night_review_time: time });
                        setEditingTarget(null);
                      }}
                      className={`p-2.5 rounded-xl text-xs font-bold ${
                        settings.night_review_time === time ? 'bg-brand-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              )}

              {editingTarget === 'reminder' && (
                <div className="space-y-1">
                  {reminderOptions.map(opt => (
                    <button
                      key={opt.minutes}
                      onClick={() => {
                        updateSettings({ default_reminder_minutes: opt.minutes });
                        setEditingTarget(null);
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-medium"
                    >
                      <span>{opt.label}</span>
                      {settings.default_reminder_minutes === opt.minutes && <Check size={16} className="text-brand-500" />}
                    </button>
                  ))}
                </div>
              )}

              {editingTarget === 'timezone' && (
                <div className="space-y-1">
                  {commonTimezones.map(tz => (
                    <button
                      key={tz.value}
                      onClick={() => {
                        updateSettings({ timezone: tz.value });
                        setEditingTarget(null);
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 text-left transition-colors"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{tz.name}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{tz.value}</p>
                      </div>
                      {settings.timezone === tz.value && <Check size={16} className="text-brand-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </div>
  );
};
