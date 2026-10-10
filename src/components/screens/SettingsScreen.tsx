import React, { useState } from 'react';
import { 
  Bell, 
  CircleAlert,
  CircleCheck,
  CircleHelp,
  Moon, 
  Volume2, 
  Globe, 
  Cloud, 
  ChevronRight, 
  FolderKanban,
  Check,
  Send,
  Clock,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AuthModal } from './AuthModal';

export const SettingsScreen: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    setActiveScreen, 
    enablePushNotifications, 
    sendTestPush, 
    permissionStatus,
    pushSubscriptionStatus,
    notificationStatusMessage,
    refreshNotificationStatus,
    user,
  } = useApp();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [editingTarget, setEditingTarget] = useState<'morning' | 'night' | 'reminder' | 'timezone' | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isRefreshingNotifications, setIsRefreshingNotifications] = useState(false);

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
    try {
      await enablePushNotifications();
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleSendTestPush = async () => {
    setIsSendingTest(true);
    try {
      await sendTestPush();
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleRefreshNotificationStatus = async () => {
    setIsRefreshingNotifications(true);
    try {
      await refreshNotificationStatus();
    } finally {
      setIsRefreshingNotifications(false);
    }
  };

  const getStatusBadge = () => {
    if (pushSubscriptionStatus === 'subscribed' && permissionStatus === 'Notifications enabled') {
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            ● This device is subscribed
          </span>
        );
    }
    if (permissionStatus === 'Notifications blocked') {
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            ● Permission blocked
          </span>
        );
    }
    if (pushSubscriptionStatus === 'worker_error' || pushSubscriptionStatus === 'error') {
      return (
        <span className="inline-flex items-center rounded-full border border-rose-300 bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-700 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
          Setup error
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
        {pushSubscriptionStatus === 'checking' ? 'Checking subscription…' : 'Not subscribed'}
      </span>
    );
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-in text-slate-800">

      <div className="space-y-5">
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

          <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Push notifications</h3>
                <p className="mt-1 text-xs text-slate-500">Permission: {permissionStatus}. Subscription: {
                  pushSubscriptionStatus === 'subscribed' ? 'saved for this account and device' :
                  pushSubscriptionStatus === 'needs_sign_in' ? 'sign in to your Supabase account' :
                  pushSubscriptionStatus === 'checking' ? 'checking…' :
                  pushSubscriptionStatus === 'unsupported' ? 'not supported by this browser' :
                  pushSubscriptionStatus === 'worker_error' ? 'service worker setup failed' :
                  pushSubscriptionStatus === 'error' ? 'could not be verified' : 'not active'
                }.</p>
              </div>
              <button
                type="button"
                onClick={handleRefreshNotificationStatus}
                disabled={isRefreshingNotifications}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
              >{isRefreshingNotifications ? 'Checking…' : 'Check status'}</button>
            </div>

            {permissionStatus === 'Notifications blocked' && (
              <div role="alert" className="mt-3 flex gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                <CircleAlert size={16} className="mt-0.5 shrink-0" />
                <p>Browser permission is blocked. In Chrome, use the site controls icon beside the address → <strong>Site settings</strong> → <strong>Notifications</strong> → <strong>Allow</strong>, then reload this page. In other browsers, open site permissions for prince6844.github.io and allow notifications. MyPlan will not repeatedly prompt while permission is blocked.</p>
              </div>
            )}
            {permissionStatus === 'Notifications unsupported' && (
              <div role="status" className="mt-3 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                <CircleHelp size={16} className="shrink-0" />This browser or browsing mode does not provide the required Notifications, Push, and Service Worker APIs. Try a supported, non-private browser window.
              </div>
            )}
            {permissionStatus === 'Notifications require a secure connection' && (
              <div role="alert" className="mt-3 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                <CircleAlert size={16} className="shrink-0" />Push notifications require HTTPS. Open <strong>https://prince6844.github.io/MyPlan/</strong>.
              </div>
            )}
            {pushSubscriptionStatus === 'subscribed' && permissionStatus === 'Notifications enabled' && (
              <p className="mt-3 flex items-center gap-2 text-xs text-emerald-700"><CircleCheck size={15} />Browser permission is granted and this device subscription is saved in Supabase.</p>
            )}
            {pushSubscriptionStatus === 'error' && (
              <p role="alert" className="mt-3 text-xs text-rose-700">Could not verify the saved subscription. Check your sign-in and Supabase `push_subscriptions` access, then select Check status.</p>
            )}
            {pushSubscriptionStatus === 'worker_error' && (
              <p role="alert" className="mt-3 text-xs text-rose-700">The MyPlan service worker could not be registered. Verify that <code>/MyPlan/sw.js</code> is deployed and refresh status. {notificationStatusMessage}</p>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {pushSubscriptionStatus !== 'subscribed' && (
                <button
                  type="button"
                  onClick={handleEnablePush}
                  disabled={isSubscribing || pushSubscriptionStatus === 'checking' || pushSubscriptionStatus === 'unsupported' || pushSubscriptionStatus === 'needs_sign_in' || permissionStatus === 'Notifications require a secure connection'}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                ><Bell size={16} />{isSubscribing ? 'Enabling…' : 'Enable Notifications'}</button>
              )}
              <button
                type="button"
                onClick={handleSendTestPush}
                disabled={isSendingTest || !user || pushSubscriptionStatus !== 'subscribed' || permissionStatus !== 'Notifications enabled'}
                className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
              ><Send size={15} />{isSendingTest ? 'Sending test…' : 'Send Test Notification'}</button>
              {(!user || pushSubscriptionStatus === 'needs_sign_in') && <button type="button" onClick={() => setShowAuthModal(true)} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Sign in to Supabase</button>}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-500">Background delivery has not been verified until a test notification arrives after all MyPlan tabs are closed. A successful test means the push provider accepted the request; it does not prove the device displayed it. Scheduled notifications also require deployed Supabase Edge Functions, VAPID secrets, the database migration, and Cron job documented in the project setup.</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm divide-y divide-slate-100 dark:divide-slate-700/50">
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
