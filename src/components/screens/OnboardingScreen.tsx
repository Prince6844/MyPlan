import React, { useState } from 'react';
import { TopBar } from '../common/TopBar';
import { useApp } from '../../context/AppContext';

const onboardingData = [
  {
    title: 'Stay on Track',
    description:
      'Plan your day, get timely reminders and never miss what matters.',
    type: 'checklist',
  },
  {
    title: 'Plan Your Day',
    description:
      'Add tasks, set your own time and keep your study, college, work and personal goals organized in one place.',
    type: 'calendar',
  },
  {
    title: 'Never Miss What Matters',
    description:
      'Get a morning summary of your day and a gentle night reminder for anything that is still pending.',
    type: 'notification',
  },
];

export const OnboardingScreen: React.FC = () => {
  const { setActiveScreen } = useApp();
  const [step, setStep] = useState(0);

  const finishOnboarding = () => {
    try {
      localStorage.setItem('myplan_has_onboarded_v1', 'true');
    } catch (e) {
      console.error(e);
    }
    setActiveScreen('home');
  };

  const handleNext = () => {
    if (step < onboardingData.length - 1) {
      setStep((current) => current + 1);
    } else {
      finishOnboarding();
    }
  };

  const current = onboardingData[step];

  return (
    <div className="relative w-full h-full min-h-[640px] flex flex-col justify-between bg-white dark:bg-slate-900 select-none px-6 pb-8 text-slate-800 dark:text-slate-100 animate-fade-in">
      <TopBar />

      <div className="flex-1 flex flex-col items-center justify-center pt-4">
        {/* Illustration */}
        <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-full bg-gradient-to-b from-[#EBF4FF] to-[#DCEBFE] dark:from-slate-800 dark:to-slate-800/60 flex items-center justify-center shadow-inner">

          {current.type === 'checklist' && (
            <>
              <div className="relative w-36 h-44 bg-white dark:bg-slate-700 rounded-2xl shadow-xl shadow-blue-500/10 border border-blue-100 dark:border-slate-600 flex flex-col p-3">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-14 h-4 bg-slate-300 dark:bg-slate-500 rounded-md flex items-center justify-center">
                  <div className="w-5 h-1.5 bg-slate-400 dark:bg-slate-600 rounded-full" />
                </div>

                <div className="mt-4 space-y-3.5 px-1">
                  {[true, true, false].map((checked, index) => (
                    <div key={index} className="flex items-center space-x-2.5">
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center ${
                          checked
                            ? 'bg-brand-500 text-white'
                            : 'border-2 border-slate-300 dark:border-slate-500'
                        }`}
                      >
                        {checked && (
                          <svg
                            className="w-3.5 h-3.5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <div
                        className={`h-2 rounded-full ${
                          checked
                            ? 'bg-slate-200 dark:bg-slate-500'
                            : 'bg-slate-100 dark:bg-slate-600'
                        } ${index === 1 ? 'w-20' : index === 2 ? 'w-14' : 'w-16'}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="absolute -top-2 -right-1 w-14 h-14 rounded-2xl bg-brand-500 shadow-lg shadow-brand-500/35 flex items-center justify-center text-white animate-bounce-gentle">
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89-2 2-2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5S10.5 3.17 10.5 4v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                </svg>
              </div>
            </>
          )}

          {current.type === 'calendar' && (
            <>
              <div className="w-40 h-36 bg-white dark:bg-slate-700 rounded-2xl shadow-xl border border-blue-100 dark:border-slate-600 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-3 w-20 bg-slate-200 dark:bg-slate-500 rounded-full" />
                  <div className="w-8 h-8 rounded-lg bg-brand-500 text-white flex items-center justify-center">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((day) => (
                    <div
                      key={day}
                      className={`h-6 rounded-md flex items-center justify-center text-[9px] ${
                        day === 3
                          ? 'bg-brand-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-600 text-slate-400'
                      }`}
                    >
                      {day}
                    </div>
                  ))}
                </div>
              </div>

              <div className="absolute -bottom-1 -right-1 w-14 h-14 rounded-2xl bg-white dark:bg-slate-700 shadow-lg border border-blue-100 dark:border-slate-600 flex items-center justify-center text-brand-500">
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="9" />
                  <polyline points="12 7 12 12 15 14" />
                </svg>
              </div>
            </>
          )}

          {current.type === 'notification' && (
            <>
              <div className="w-40 h-44 bg-white dark:bg-slate-700 rounded-[2rem] shadow-xl border border-blue-100 dark:border-slate-600 p-3">
                <div className="w-16 h-1.5 rounded-full bg-slate-200 dark:bg-slate-500 mx-auto mb-4" />
                <div className="space-y-3">
                  <div className="rounded-xl bg-blue-50 dark:bg-slate-600 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-lg bg-brand-500" />
                      <div className="h-2 w-16 bg-slate-300 dark:bg-slate-400 rounded-full" />
                    </div>
                    <div className="h-2 w-full bg-slate-200 dark:bg-slate-500 rounded-full mb-1.5" />
                    <div className="h-2 w-3/4 bg-slate-200 dark:bg-slate-500 rounded-full" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-emerald-400" />
                    <div className="h-2 w-24 bg-slate-200 dark:bg-slate-500 rounded-full" />
                  </div>
                </div>
              </div>

              <div className="absolute -top-2 -right-2 w-14 h-14 rounded-2xl bg-brand-500 shadow-lg shadow-brand-500/35 flex items-center justify-center text-white animate-bounce-gentle">
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89-2 2-2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5S10.5 3.17 10.5 4v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                </svg>
              </div>
            </>
          )}
        </div>

        {/* Text */}
        <div className="text-center mt-8 px-2 max-w-xs">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {current.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2.5 leading-relaxed">
            {current.description}
          </p>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center space-x-2 mt-6">
          {onboardingData.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === step
                  ? 'w-7 bg-brand-500'
                  : 'w-2 bg-slate-200 dark:bg-slate-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Buttons */}
      <div className="w-full space-y-3 pt-4">
        <button
          onClick={handleNext}
          className="w-full py-3.5 rounded-full bg-brand-500 hover:bg-brand-600 active:scale-[0.98] text-white font-semibold text-sm shadow-float transition-all"
        >
          {step === onboardingData.length - 1 ? 'Get Started' : 'Next'}
        </button>

        <button
          onClick={finishOnboarding}
          className="w-full py-2 text-center text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium transition-colors"
        >
          Skip
        </button>
      </div>
    </div>
  );
};
