import React from 'react';
import { BookOpen } from 'lucide-react';

export default function ChapterSlider({ value, maxChapter, onChange }) {
  const max = maxChapter || 1;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-xl border-t border-slate-200/60 px-6 py-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-slate-500 shrink-0">
            <BookOpen size={14} strokeWidth={2.5} />
            <span className="text-xs font-semibold uppercase tracking-wide">Chapter</span>
          </div>

          <div className="flex-1">
            <input
              type="range"
              min={1}
              max={max}
              step={1}
              value={value}
              onChange={(e) => onChange(Number(e.target.value))}
              className="w-full h-1.5 appearance-none rounded-full bg-slate-200 cursor-pointer accent-emerald-500"
            />
          </div>

          <div className="shrink-0 min-w-[4.5rem] text-right">
            <span className="text-emerald-600 font-bold text-sm">{value}</span>
            <span className="text-slate-400 text-xs"> / {max}</span>
          </div>
        </div>
        <div className="mt-1.5 flex justify-center">
          <span className="text-slate-400 text-xs">
            Showing relationships up to chapter {value}
          </span>
        </div>
      </div>
    </div>
  );
}
