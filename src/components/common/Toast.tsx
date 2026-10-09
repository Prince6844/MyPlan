import React from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Toast: React.FC = () => {
  const { toastMessage } = useApp();

  if (!toastMessage) return null;

  const icons = {
    success: <CheckCircle2 size={16} className="text-emerald-500" />,
    error: <AlertCircle size={16} className="text-rose-500" />,
    info: <Info size={16} className="text-brand-500" />,
  };

  return (
    <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <div className="bg-slate-900/90 dark:bg-slate-800/95 text-white px-4 py-2.5 rounded-full shadow-lg flex items-center space-x-2.5 backdrop-blur-md border border-slate-700/50 text-xs font-medium">
        {icons[toastMessage.type]}
        <span>{toastMessage.text}</span>
      </div>
    </div>
  );
};
