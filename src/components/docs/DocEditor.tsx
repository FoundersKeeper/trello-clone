import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import MDEditor from '@uiw/react-md-editor'
import { useDocStore } from '../../store/docStore'
import type { DocPage } from '../../types'

interface Props {
  page: DocPage
}

export default function DocEditor({ page }: Props) {
  const updatePage = useDocStore(s => s.updatePage)
  const pages = useDocStore(s => s.pages)
  const navigate = useNavigate()

  const [content, setContent] = useState(page.content)
  const [title, setTitle] = useState(page.title)
  const [editingTitle, setEditingTitle] = useState(false)
  const [previewMode, setPreviewMode] = useState<'edit' | 'preview' | 'live'>('live')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync when page changes (navigation)
  useEffect(() => {
    setContent(page.content)
    setTitle(page.title)
  }, [page.id])

  // Auto-save with debounce
  const scheduleSave = useCallback((newContent: string) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      updatePage(page.id, { content: newContent })
    }, 800)
  }, [page.id, updatePage])

  const handleContentChange = (val?: string) => {
    const v = val ?? ''
    setContent(v)
    scheduleSave(v)
  }

  const saveTitle = () => {
    if (title.trim()) updatePage(page.id, { title: title.trim() })
    else setTitle(page.title)
    setEditingTitle(false)
  }

  // Replace [[Seitenname]] with markdown links before rendering
  const processedContent = content.replace(/\[\[([^\]]+)\]\]/g, (_, name: string) => {
    const linked = pages.find(p => p.title.toLowerCase() === name.toLowerCase())
    if (linked) return `[${name}](/docs/${linked.id})`
    return `~~[[${name}]]~~`
  })

  return (
    <div className="flex flex-col h-full" data-color-mode="dark">
      {/* Page header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 flex-shrink-0">
        <div className="flex-1">
          {editingTitle ? (
            <input
              className="text-2xl font-bold bg-transparent text-white focus:outline-none border-b border-blue-500 w-full"
              value={title}
              autoFocus
              onChange={e => setTitle(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={e => {
                if (e.key === 'Enter') saveTitle()
                if (e.key === 'Escape') { setTitle(page.title); setEditingTitle(false) }
              }}
            />
          ) : (
            <h1
              className="text-2xl font-bold text-white cursor-pointer hover:text-gray-300 transition-colors"
              onDoubleClick={() => setEditingTitle(true)}
              title="Doppelklick zum Umbenennen"
            >
              {title}
            </h1>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Zuletzt bearbeitet: {new Date(page.updatedAt).toLocaleString('de-DE')}
          </p>
        </div>

        {/* View toggle */}
        <div className="flex gap-1 bg-gray-800 rounded-lg p-1 ml-4">
          {(['edit', 'live', 'preview'] as const).map(mode => (
            <button
              key={mode}
              className={`text-xs px-2.5 py-1 rounded-md transition-colors font-medium ${previewMode === mode ? 'bg-gray-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
              onClick={() => setPreviewMode(mode)}
            >
              {mode === 'edit' ? '✏️ Editor' : mode === 'live' ? '⚡ Split' : '👁 Preview'}
            </button>
          ))}
        </div>
      </div>

      {/* Wiki-link hint */}
      <div className="px-6 py-1.5 bg-gray-800/50 border-b border-gray-700/50 flex-shrink-0">
        <p className="text-xs text-gray-600">
          Tipp: <code className="bg-gray-700 px-1 rounded text-gray-400">[[Seitenname]]</code> erstellt einen Wiki-Link zu einer anderen Docs-Seite.
        </p>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <MDEditor
          value={previewMode === 'preview' ? processedContent : content}
          onChange={previewMode === 'preview' ? undefined : handleContentChange}
          preview={previewMode}
          height="100%"
          style={{ background: 'transparent' }}
          textareaProps={{ placeholder: 'Seite schreiben… Markdown wird unterstützt.' }}
          previewOptions={{
            components: {
              a: ({ href, children }: { href?: string; children?: React.ReactNode }) => {
                if (href?.startsWith('/docs/')) {
                  return (
                    <a
                      href={href}
                      onClick={e => { e.preventDefault(); navigate(href) }}
                      style={{ color: '#60a5fa', cursor: 'pointer' }}
                    >
                      {children}
                    </a>
                  )
                }
                return <a href={href} target="_blank" rel="noreferrer">{children}</a>
              },
            },
          }}
        />
      </div>
    </div>
  )
}
