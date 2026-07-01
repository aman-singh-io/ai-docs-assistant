import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Share2, Users, X } from 'lucide-react'
import toast from 'react-hot-toast'
import characterService from '../../services/characterService'
import GraphCanvas from '../../components/GraphCanvas/GraphCanvas'
import ChapterSlider from '../../components/ChapterSlider/ChapterSlider'
import CharacterWikiDrawer from '../../components/CharacterWikiDrawer/CharacterWikiDrawer'

export default function CharacterGraphPage() {
  const { id: documentId } = useParams()

  const [allRelationships, setAllRelationships] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedChapter, setSelectedChapter] = useState(1)
  const [selectedCharacter, setSelectedCharacter] = useState(null)
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [showCharacterList, setShowCharacterList] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const relationships = await characterService.getRelationships(
          documentId,
          9999,
        )
        setAllRelationships(relationships)
        if (relationships.length > 0) {
          const max = Math.max(...relationships.map((r) => r.chapterNumber))
          setSelectedChapter(max)
        }
      } catch (err) {
        toast.error(err?.message || 'Failed to load character relationships.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [documentId])

  const maxChapter = useMemo(() => {
    if (allRelationships.length === 0) return 1
    return Math.max(...allRelationships.map((r) => r.chapterNumber))
  }, [allRelationships])

  const filteredRelationships = useMemo(
    () => allRelationships.filter((r) => r.chapterNumber <= selectedChapter),
    [allRelationships, selectedChapter],
  )

  const nodes = useMemo(() => {
    const nameSet = new Set()
    filteredRelationships.forEach((r) => {
      nameSet.add(r.source)
      nameSet.add(r.target)
    })
    return Array.from(nameSet).map((name) => ({ id: name, label: name }))
  }, [filteredRelationships])

  const edges = useMemo(
    () =>
      filteredRelationships.map((r) => ({
        source: r.source,
        target: r.target,
        relationshipType: r.relationshipType,
        context: r.context,
      })),
    [filteredRelationships],
  )

  // Characters grouped by first-appearance chapter (up to selectedChapter)
  const charactersByChapter = useMemo(() => {
    const seen = new Set()
    const byChapter = {}
    const sorted = [...allRelationships].sort(
      (a, b) => a.chapterNumber - b.chapterNumber,
    )
    sorted.forEach((rel) => {
      if (rel.chapterNumber > selectedChapter) return
      const ch = rel.chapterNumber
      if (!byChapter[ch]) byChapter[ch] = []
      ;[rel.source, rel.target].forEach((name) => {
        if (!seen.has(name)) {
          seen.add(name)
          byChapter[ch].push(name)
        }
      })
    })
    return byChapter
  }, [allRelationships, selectedChapter])

  const handleNodeClick = useCallback(
    async (node) => {
      setSelectedCharacter(node)
      setProfile(null)
      setProfileLoading(true)
      try {
        const data = await characterService.getCharacterProfile(
          documentId,
          node.label,
          selectedChapter,
        )
        setProfile(data?.profile ?? null)
      } catch {
        setProfile(null)
      } finally {
        setProfileLoading(false)
      }
    },
    [documentId, selectedChapter],
  )

  const handleCloseDrawer = useCallback(() => {
    setSelectedCharacter(null)
    setProfile(null)
  }, [])

  if (!loading && allRelationships.length === 0) {
    return (
      <div className='h-screen bg-neutral-50 flex flex-col items-center justify-center gap-4'>
        <div className='w-16 h-16 rounded-2xl bg-white border border-slate-200/60 shadow-sm flex items-center justify-center'>
          <Share2 size={28} className='text-slate-400' />
        </div>
        <div className='text-center'>
          <p className='text-slate-900 font-semibold text-lg'>
            No character data yet
          </p>
          <p className='text-slate-500 text-sm mt-1 max-w-sm'>
            Generate chapter summaries first, then extract relationships from
            the document detail page.
          </p>
        </div>
        <Link
          to={`/documents/${documentId}`}
          className='inline-flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors mt-2'
        >
          <ArrowLeft size={14} />
          Back to document
        </Link>
      </div>
    )
  }

  const chapterEntries = Object.entries(charactersByChapter)
    .map(([ch, names]) => [Number(ch), names])
    .sort((a, b) => a[0] - b[0])

  return (
    <div className='h-screen bg-neutral-50 overflow-hidden flex flex-col'>
      {/* Top bar */}
      <div className='shrink-0 flex items-center gap-3 px-6 h-16 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl z-10'>
        <Link
          to={`/documents/${documentId}`}
          className='inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors font-medium'
        >
          <ArrowLeft size={15} />
          Back
        </Link>
        <div className='h-4 w-px bg-slate-200' />
        <div className='flex items-center gap-2'>
          <div className='w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-sm shadow-emerald-500/20'>
            <Share2 size={13} className='text-white' />
          </div>
          <span className='text-sm font-semibold text-slate-900'>
            Character Relationships
          </span>
        </div>

        <div className='ml-auto flex items-center gap-3'>
          <span className='text-xs text-slate-400 font-medium'>
            {nodes.length} character{nodes.length !== 1 ? 's' : ''} ·{' '}
            {edges.length} relationship{edges.length !== 1 ? 's' : ''}
          </span>

          {/* Character list toggle */}
          <button
            onClick={() => setShowCharacterList((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              showCharacterList
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-transparent'
            }`}
          >
            <Users size={13} />
            Characters
          </button>
        </div>
      </div>

      {/* Content row: optional sidebar + graph */}
      <div
        className='flex-1 flex overflow-hidden'
        style={{ paddingBottom: '5.5rem' }}
      >
        {/* Character list sidebar */}
        {showCharacterList && (
          <aside className='w-60 shrink-0 bg-white border-r border-slate-200/60 flex flex-col overflow-hidden'>
            <div className='flex items-center justify-between px-4 py-3 border-b border-slate-100'>
              <span className='text-xs font-semibold text-slate-500 uppercase tracking-wide'>
                By Chapter
              </span>
              <button
                onClick={() => setShowCharacterList(false)}
                className='text-slate-400 hover:text-slate-700 transition-colors'
              >
                <X size={14} />
              </button>
            </div>

            <div className='flex-1 overflow-y-auto py-2'>
              {loading ? (
                <p className='px-4 py-6 text-xs text-slate-400 text-center'>
                  Loading…
                </p>
              ) : chapterEntries.length === 0 ? (
                <p className='px-4 py-6 text-xs text-slate-400 text-center'>
                  No characters yet
                </p>
              ) : (
                chapterEntries.map(([ch, names]) => (
                  <div key={ch} className='mb-1'>
                    {/* Chapter header */}
                    <div className='flex items-center gap-2 px-4 py-1.5'>
                      <span className='text-[10px] font-bold text-slateald-400 uppercase tracking-wider text-slate-400'>
                        Chapter {ch}
                      </span>
                      <span className='ml-auto text-[10px] font-semibold text-slate-300'>
                        {names.length}
                      </span>
                    </div>

                    {/* Character names */}
                    {names.sort().map((name) => (
                      <button
                        key={name}
                        onClick={() =>
                          handleNodeClick({ id: name, label: name })
                        }
                        className={`w-full text-left px-4 py-1.5 text-xs font-medium transition-colors truncate ${
                          selectedCharacter?.label === name
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>

            {/* Footer: total count */}
            <div className='border-t border-slate-100 px-4 py-2.5'>
              <p className='text-[10px] text-slate-400'>
                <span className='font-semibold text-slate-600'>
                  {nodes.length}
                </span>{' '}
                characters up to chapter {selectedChapter}
              </p>
            </div>
          </aside>
        )}

        {/* Graph canvas */}
        {loading ? (
          <div className='flex-1 flex items-center justify-center'>
            <div className='flex flex-col items-center gap-3'>
              <svg
                className='animate-spin h-7 w-7 text-emerald-500'
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
              >
                <circle
                  className='opacity-25'
                  cx='12'
                  cy='12'
                  r='10'
                  stroke='currentColor'
                  strokeWidth='3'
                />
                <path
                  className='opacity-75'
                  fill='currentColor'
                  d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                />
              </svg>
              <p className='text-slate-500 text-sm font-medium'>
                Loading relationships…
              </p>
            </div>
          </div>
        ) : (
          <div className='flex-1 relative'>
            <GraphCanvas
              nodes={nodes}
              edges={edges}
              onNodeClick={handleNodeClick}
            />
          </div>
        )}
      </div>

      {/* Chapter slider */}
      <ChapterSlider
        value={selectedChapter}
        maxChapter={maxChapter}
        onChange={setSelectedChapter}
      />

      {/* Character wiki drawer */}
      {selectedCharacter && (
        <CharacterWikiDrawer
          character={selectedCharacter}
          profile={profile}
          loading={profileLoading}
          onClose={handleCloseDrawer}
        />
      )}
    </div>
  )
}
