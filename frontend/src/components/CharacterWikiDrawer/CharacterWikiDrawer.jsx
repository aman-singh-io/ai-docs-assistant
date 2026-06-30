import React, { useEffect, useRef } from 'react'
import { X, Loader2, User } from 'lucide-react'

const STATUS_STYLES = {
  alive: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  dead: 'bg-red-50 text-red-600 border border-red-200',
  unknown: 'bg-slate-100 text-slate-500 border border-slate-200',
}

function statusStyle(status) {
  return STATUS_STYLES[(status || '').toLowerCase()] ?? STATUS_STYLES.unknown
}

export default function CharacterWikiDrawer({
  character,
  profile,
  loading,
  onClose,
}) {
  const drawerRef = useRef(null)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleOverlayClick = (e) => {
    if (drawerRef.current && !drawerRef.current.contains(e.target)) {
      onClose()
    }
  }

  if (!character) return null

  return (
    <div className='fixed inset-0 z-30' onClick={handleOverlayClick}>
      {/* Subtle backdrop */}
      <div className='absolute inset-0 bg-slate-900/10' />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className='absolute top-0 right-0 h-full w-full max-w-[38%] min-w-[300px] bg-white border-l border-slate-200/60 shadow-2xl shadow-slate-200/60 flex flex-col'
        style={{ animation: 'slideInRight 0.22s ease-out' }}
      >
        {/* Header */}
        <div className='flex items-start justify-between p-6 border-b border-slate-200/60 bg-gradient-to-br from-slate-50/50 to-white shrink-0'>
          <div className='flex items-start gap-3 min-w-0'>
            <div className='flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-md shadow-emerald-500/20 flex items-center justify-center mt-20.5'>
              <User size={18} className='text-white' />
            </div>
            <div className='min-w-0'>
              <h2 className='text-lg font-bold text-slate-900 leading-tight truncate'>
                {character.label}
              </h2>
              <div className='flex flex-wrap items-center gap-1.5 mt-1.5'>
                {character.status && (
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${statusStyle(character.status)}`}
                  >
                    {character.status}
                  </span>
                )}
                {character.faction && (
                  <span className='inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200'>
                    {character.faction}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className='flex-shrink-0 ml-3 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors'
            aria-label='Close drawer'
          >
            <X size={17} />
          </button>
        </div>

        {/* Biography */}
        <div className='flex-1 overflow-y-auto p-6'>
          <h3 className='text-xs font-bold uppercase tracking-widest text-slate-400 mb-3'>
            Biography
          </h3>
          {loading ? (
            <div className='flex items-center gap-2 text-slate-400'>
              <Loader2 size={15} className='animate-spin text-emerald-500' />
              <span className='text-sm'>Generating profile…</span>
            </div>
          ) : profile ? (
            <p className='text-slate-700 text-sm leading-relaxed whitespace-pre-wrap'>
              {profile}
            </p>
          ) : (
            <p className='text-slate-400 text-sm italic'>
              No biography available for this character up to the selected
              chapter.
            </p>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  )
}
