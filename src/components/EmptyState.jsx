import React from 'react';
import { Mic, FolderOpen, Search } from 'lucide-react';

const EmptyState = ({ type = 'notes', searchQuery = '', folder = null }) => {
  if (type === 'search') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
          <Search className="w-8 h-8 text-slate-300 dark:text-slate-600" />
        </div>
        <h3 className="text-base font-semibold text-slate-600 dark:text-slate-400 mb-1">No results found</h3>
        <p className="text-sm text-slate-400 dark:text-slate-600 max-w-xs">
          No notes match "<span className="font-medium text-slate-500">{searchQuery}</span>". Try a different keyword.
        </p>
      </div>
    );
  }

  if (type === 'folder') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
          <FolderOpen className="w-8 h-8 text-slate-300 dark:text-slate-600" />
        </div>
        <h3 className="text-base font-semibold text-slate-600 dark:text-slate-400 mb-1">
          "{folder}" is empty
        </h3>
        <p className="text-sm text-slate-400 dark:text-slate-600 max-w-xs">
          Save a note and assign it to this folder to see it here.
        </p>
      </div>
    );
  }

  // Default: first-time / no notes
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {/* Animated mic icon */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
          <Mic className="w-9 h-9 text-indigo-400" />
        </div>
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
          <span className="text-white text-[10px] font-bold">✦</span>
        </span>
      </div>

      <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">
        Your notes will appear here
      </h3>
      <p className="text-sm text-slate-400 dark:text-slate-500 max-w-xs leading-relaxed">
        Tap the microphone above to record your first voice note, or just type one out.
      </p>

      {/* Steps */}
      <div className="mt-8 flex flex-col gap-3 text-left w-full max-w-xs">
        {[
          { step: '1', text: 'Hit the mic button to start recording' },
          { step: '2', text: 'Speak — your words are transcribed live' },
          { step: '3', text: 'Save and let AI summarize it for you' },
        ].map(({ step, text }) => (
          <div key={step} className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
              {step}
            </span>
            <span className="text-sm text-slate-500 dark:text-slate-400">{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmptyState;
