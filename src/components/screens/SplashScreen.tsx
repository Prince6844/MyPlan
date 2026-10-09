import React from 'react';
import { TopBar } from '../common/TopBar';
import { useApp } from '../../context/AppContext';

export const SplashScreen: React.FC = () => {
  const { setActiveScreen } = useApp();

  return (
    <div 
      onClick={() => setActiveScreen('onboarding')}
      className="relative w-full h-full min-h-[640px] flex flex-col justify-between overflow-hidden cursor-pointer select-none bg-gradient-to-b from-[#1C7DF8] via-[#1470EA] to-[#0A57D1] text-white"
    >
      <TopBar light />

      {/* Center Branding */}
      <div className="flex-1 flex flex-col items-center justify-center -mt-10 px-6 text-center animate-fade-in">
        {/* App Logo */}
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white shadow-2xl shadow-blue-900/30 flex items-center justify-center p-4 transition-transform duration-500 hover:scale-105">
          <div className="w-full h-full rounded-2xl bg-gradient-to-br from-[#1E82FF] to-[#0C63DF] flex items-center justify-center relative shadow-inner">
            {/* Circle outline */}
            <div className="w-12 h-12 rounded-full border-2 border-white/40 flex items-center justify-center">
              {/* Bold Checkmark */}
              <svg 
                className="w-7 h-7 text-white" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="3.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          </div>
        </div>

        {/* App Name */}
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-6 text-white drop-shadow-sm">
          MyPlan
        </h1>

        {/* Taglines */}
        <div className="mt-3 space-y-1">
          <p className="text-sm font-semibold tracking-wide text-blue-100">
            Plan Today
          </p>
          <p className="text-xs font-normal text-blue-200/90 tracking-wide">
            Build a Better Tomorrow
          </p>
        </div>
      </div>

      {/* Decorative Wave at the bottom matching reference */}
      <div className="relative w-full h-32 pointer-events-none opacity-40">
        <svg 
          className="absolute bottom-0 w-full h-full" 
          viewBox="0 0 1440 320" 
          preserveAspectRatio="none"
        >
          <path 
            fill="#3B82F6" 
            fillOpacity="0.4" 
            d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,165.3C960,149,1056,171,1152,186.7C1248,203,1344,213,1392,218.7L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          ></path>
          <path 
            fill="#60A5FA" 
            fillOpacity="0.25" 
            d="M0,224L60,208C120,192,240,160,360,165.3C480,171,600,213,720,229.3C840,245,960,235,1080,208C1200,181,1320,139,1380,117.3L1440,96L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
          ></path>
        </svg>
      </div>

      {/* Screen label tag */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-white/50 tracking-wider">
        TAP TO CONTINUE
      </div>
    </div>
  );
};
