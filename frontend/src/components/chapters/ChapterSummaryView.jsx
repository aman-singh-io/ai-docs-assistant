import React, { useState } from 'react'
import { BookOpen, RefreshCw, AlertCircle, Loader2 } from 'lucide-react'
import MarkdownRenderer from '../common/MarkdownRenderer'
import toast from 'react-hot-toast'

/**
 * ChapterSummaryView
 * Displays generated chapter summaries with collapsible accordion UI
 *
 * Props:
 * - documentId: ID of the document
 * - chapters: Array of chapter objects
 * - isGenerating: Boolean indicating if generation is in progress
 * - onGenerate: Callback to trigger chapter generation
 * - onError: Callback for error handling
 * - disabled: Disable button when document too short
 */
const ChapterSummaryView = ({
  documentId,
  chapters,
  isGenerating,
  onGenerate,
  onError,
  disabled,
}) => {
  const [expandedChapters, setExpandedChapters] = useState({})

  const handleToggleChapter = (chapterIndex) => {
    setExpandedChapters((prev) => ({
      ...prev,
      [chapterIndex]: !prev[chapterIndex],
    }))
  }

  const handleRegenerate = () => {
    if (disabled) {
      toast.error('Document too short for chapter generation')
      return
    }
    onGenerate()
  }

  const renderKeyTakeaways = (takeaways) => {
    return (
      <ul className='space-y-2 mt-3'>
        {takeaways.map((takeaway, index) => (
          <li
            key={index}
            className='flex items-start gap-2 text-sm text-slate-600'
          >
            <span className='text-emerald-600 font-semibold'>{index + 1}</span>
            <span>{takeaway}</span>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div
      className='bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden'
      aria-labelledby='chapter-summary-title'
    >
      {/* Header */}
      <div className='px-6 py-5 border-b border-slate-200/60 bg-gradient-to-br from-slate-50/50 to-white/50'>
        <div className='flex items-center justify-between gap-3'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/25 flex items-center justify-center'>
              <BookOpen className='w-5 h-5 text-white' strokeWidth={2} />
            </div>
            <div>
              <h3
                id='chapter-summary-title'
                className='text-lg font-semibold text-slate-900'
              >
                Chapter Summary
              </h3>
              <p className='text-xs text-slate-500'>
                AI-detected chapter structure
              </p>
            </div>
          </div>
          <button
            onClick={handleRegenerate}
            disabled={isGenerating || disabled}
            className='shrink-0 h-10 px-4 bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 text-slate-700 text-sm font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center gap-2'
            aria-label='Regenerate chapter summaries'
          >
            {isGenerating ? (
              <>
                <Loader2 className='w-4 h-4 animate-spin' />
                Regenerating...
              </>
            ) : (
              <>
                <RefreshCw className='w-4 h-4' />
                Regenerate
              </>
            )}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isGenerating && (
        <div className='px-6 py-8 text-center' aria-live='polite'>
          <Loader2 className='w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3' />
          <p className='text-sm text-slate-600'>
            Analyzing document structure...
          </p>
          <p className='text-xs text-slate-500 mt-1'>
            This may take up to 2 minutes for long documents
          </p>
        </div>
      )}

      {/* Error State */}
      {!isGenerating && chapters === null && (
        <div className='px-6 py-8 text-center' role='alert'>
          <AlertCircle className='w-8 h-8 text-amber-600 mx-auto mb-3' />
          <p className='text-sm text-slate-600 font-medium'>
            No chapter summaries yet
          </p>
          <p className='text-xs text-slate-500 mt-1'>
            Click "Generate" to create an AI-detected chapter breakdown
          </p>
          {!disabled && (
            <button
              onClick={onGenerate}
              className='mt-3 h-10 px-6 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white text-sm font-semibold rounded-xl transition-all duration-200 active:scale-95'
            >
              Generate Chapters
            </button>
          )}
        </div>
      )}

      {/* Chapter List */}
      {!isGenerating && chapters && chapters.length > 0 && (
        <div
          className='p-4 md:p-6 max-h-[70vh] overflow-y-auto'
          role='region'
          aria-label='Chapter summaries'
          tabIndex={0}
        >
          <div className='space-y-3'>
            {chapters.map((chapter, index) => (
              <div
                key={index}
                className='border border-slate-200 rounded-xl overflow-hidden transition-all duration-200 hover:border-emerald-300 focus-within:border-emerald-400 mb-3'
              >
                <button
                  onClick={() => handleToggleChapter(index)}
                  className='w-full flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors'
                  aria-expanded={expandedChapters[index]}
                  aria-controls={`chapter-details-${index}`}
                >
                  <div className='flex items-center gap-3'>
                    <span className='flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 text-sm font-semibold'>
                      {chapter.chapterNumber}
                    </span>
                    <h4 className='font-semibold text-slate-900'>
                      {chapter.title}
                    </h4>
                  </div>
                  <div
                    className={`transform transition-transform duration-200 ${expandedChapters[index] ? 'rotate-180' : ''}`}
                  >
                    <svg
                      className='w-5 h-5 text-slate-500'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M19 9l-7 7-7-7'
                      />
                    </svg>
                  </div>
                </button>
                <div
                  id={`chapter-details-${index}`}
                  className={`transition-all duration-300 ${expandedChapters[index] ? 'max-h-[3000px] opacity-100 overflow-y-auto' : 'max-h-0 opacity-0 overflow-hidden'}`}
                >
                  <div className='p-4 bg-white border-t border-slate-200 space-y-4'>
                    <div>
                      <p className='text-sm text-slate-700 leading-relaxed whitespace-pre-wrap'>
                        {chapter.summary}
                      </p>
                    </div>
                    <div>
                      <p className='text-xs font-semibold text-slate-900 mb-2'>
                        Key Takeaways:
                      </p>
                      {renderKeyTakeaways(chapter.keyTakeaways)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disabled State */}
      {disabled && !isGenerating && (
        <div className='px-6 py-8 text-center' role='alert'>
          <AlertCircle className='w-8 h-8 text-amber-600 mx-auto mb-3' />
          <p className='text-sm text-slate-600 font-medium'>
            Document too short
          </p>
          <p className='text-xs text-slate-500 mt-1'>
            Minimum 10,000 characters required for chapter detection
          </p>
        </div>
      )}
    </div>
  )
}

export default ChapterSummaryView
