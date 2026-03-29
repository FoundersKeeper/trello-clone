import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDocStore } from '../../store/docStore'
import type { DocFolder, DocPage } from '../../types'

interface Props {
  activePageId?: string
}

export default function DocsSidebar({ activePageId }: Props) {
  const navigate = useNavigate()
  const folders = useDocStore(s => s.folders)
  const pages = useDocStore(s => s.pages)
  const addFolder = useDocStore(s => s.addFolder)
  const addPage = useDocStore(s => s.addPage)
  const updateFolder = useDocStore(s => s.updateFolder)
  const deleteFolder = useDocStore(s => s.deleteFolder)
  const updatePage = useDocStore(s => s.updatePage)
  const deletePage = useDocStore(s => s.deletePage)
  const movePage = useDocStore(s => s.movePage)

  const [newFolderTitle, setNewFolderTitle] = useState('')
  const [addingFolder, setAddingFolder] = useState(false)
  const [addingPageIn, setAddingPageIn] = useState<string | null>(null) // folderId or 'root'
  const [newPageTitle, setNewPageTitle] = useState('')
  const [renamingFolder, setRenamingFolder] = useState<string | null>(null)
  const [renamingPage, setRenamingPage] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set())
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  const rootPages = pages.filter(p => !p.folderId)

  const handleAddFolder = () => {
    if (!newFolderTitle.trim()) { setAddingFolder(false); return }
    addFolder(newFolderTitle.trim())
    setNewFolderTitle('')
    setAddingFolder(false)
  }

  const handleAddPage = (folderId?: string) => {
    if (!newPageTitle.trim()) { setAddingPageIn(null); return }
    const page = addPage(newPageTitle.trim(), folderId)
    setNewPageTitle('')
    setAddingPageIn(null)
    navigate(`/docs/${page.id}`)
  }

  const handleDeletePage = (page: DocPage) => {
    deletePage(page.id)
    if (activePageId === page.id) navigate('/docs')
  }

  const handleDeleteFolder = (folder: DocFolder) => {
    deleteFolder(folder.id)
  }

  const toggleFolder = (id: string) => {
    setCollapsedFolders(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const startRenameFolder = (folder: DocFolder) => {
    setRenamingFolder(folder.id)
    setRenameValue(folder.title)
  }

  const startRenamePage = (page: DocPage) => {
    setRenamingPage(page.id)
    setRenameValue(page.title)
  }

  const saveRenameFolder = () => {
    if (renameValue.trim() && renamingFolder) {
      updateFolder(renamingFolder, { title: renameValue.trim() })
    }
    setRenamingFolder(null)
  }

  const saveRenamePage = () => {
    if (renameValue.trim() && renamingPage) {
      updatePage(renamingPage, { title: renameValue.trim() })
    }
    setRenamingPage(null)
  }

  const renderPage = (page: DocPage) => (
    <div
      key={page.id}
      className={`group flex items-center gap-1 rounded-lg px-2 py-1.5 cursor-pointer transition-colors ${activePageId === page.id ? 'bg-blue-600/20 text-blue-300' : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'} ${dragOverId === page.folderId || dragOverId === 'root' ? '' : ''}`}
      draggable
      onDragStart={e => e.dataTransfer.setData('pageId', page.id)}
      onClick={() => navigate(`/docs/${page.id}`)}
    >
      <span className="text-xs opacity-50">📄</span>
      {renamingPage === page.id ? (
        <input
          className="flex-1 bg-gray-700 text-gray-100 text-sm rounded px-1 py-0 focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={renameValue}
          autoFocus
          onChange={e => setRenameValue(e.target.value)}
          onBlur={saveRenamePage}
          onKeyDown={e => { if (e.key === 'Enter') saveRenamePage(); if (e.key === 'Escape') setRenamingPage(null) }}
          onClick={e => e.stopPropagation()}
        />
      ) : (
        <span className="flex-1 text-sm truncate">{page.title}</span>
      )}
      <div className="opacity-0 group-hover:opacity-100 flex gap-0.5" onClick={e => e.stopPropagation()}>
        <button
          className="p-0.5 hover:text-white text-xs rounded hover:bg-gray-600"
          title="Umbenennen"
          onClick={() => startRenamePage(page)}
        >✎</button>
        <button
          className="p-0.5 hover:text-red-400 text-xs rounded hover:bg-gray-600"
          title="Löschen"
          onClick={() => handleDeletePage(page)}
        >×</button>
      </div>
    </div>
  )

  const renderFolder = (folder: DocFolder) => {
    const folderPages = pages.filter(p => p.folderId === folder.id)
    const isCollapsed = collapsedFolders.has(folder.id)
    const isOver = dragOverId === folder.id

    return (
      <div
        key={folder.id}
        onDragOver={e => { e.preventDefault(); setDragOverId(folder.id) }}
        onDragLeave={() => setDragOverId(null)}
        onDrop={e => {
          e.preventDefault()
          const pageId = e.dataTransfer.getData('pageId')
          if (pageId) movePage(pageId, folder.id)
          setDragOverId(null)
        }}
        className={`rounded-lg transition-colors ${isOver ? 'bg-blue-900/20 ring-1 ring-blue-500/40' : ''}`}
      >
        {/* Folder header */}
        <div className="group flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-gray-700 cursor-pointer"
          onClick={() => toggleFolder(folder.id)}
        >
          <span className="text-xs text-gray-500">{isCollapsed ? '▶' : '▼'}</span>
          <span className="text-xs">📁</span>
          {renamingFolder === folder.id ? (
            <input
              className="flex-1 bg-gray-700 text-gray-100 text-sm rounded px-1 py-0 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={renameValue}
              autoFocus
              onChange={e => setRenameValue(e.target.value)}
              onBlur={saveRenameFolder}
              onKeyDown={e => { if (e.key === 'Enter') saveRenameFolder(); if (e.key === 'Escape') setRenamingFolder(null) }}
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <span className="flex-1 text-sm font-medium text-gray-300 truncate">{folder.title}</span>
          )}
          <div className="opacity-0 group-hover:opacity-100 flex gap-0.5" onClick={e => e.stopPropagation()}>
            <button
              className="p-0.5 hover:text-white text-xs rounded hover:bg-gray-600 text-gray-500"
              title="Seite hinzufügen"
              onClick={() => { setAddingPageIn(folder.id); setNewPageTitle('') }}
            >+</button>
            <button
              className="p-0.5 hover:text-white text-xs rounded hover:bg-gray-600 text-gray-500"
              title="Umbenennen"
              onClick={() => startRenameFolder(folder)}
            >✎</button>
            <button
              className="p-0.5 hover:text-red-400 text-xs rounded hover:bg-gray-600 text-gray-500"
              title="Löschen"
              onClick={() => handleDeleteFolder(folder)}
            >×</button>
          </div>
        </div>

        {!isCollapsed && (
          <div className="ml-4 flex flex-col gap-0.5">
            {folderPages.map(renderPage)}
            {addingPageIn === folder.id && (
              <div className="px-2 py-1">
                <input
                  className="w-full bg-gray-700 text-gray-100 text-sm rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 border border-gray-600"
                  placeholder="Seitenname..."
                  value={newPageTitle}
                  autoFocus
                  onChange={e => setNewPageTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddPage(folder.id); if (e.key === 'Escape') setAddingPageIn(null) }}
                  onBlur={() => setTimeout(() => setAddingPageIn(null), 150)}
                />
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-gray-700">
        <span className="text-sm font-semibold text-gray-200">📝 Docs</span>
        <div className="flex gap-1">
          <button
            className="text-xs text-gray-500 hover:text-gray-200 px-1.5 py-0.5 rounded hover:bg-gray-700 transition-colors"
            title="Neuer Ordner"
            onClick={() => { setAddingFolder(true); setNewFolderTitle('') }}
          >
            📁+
          </button>
          <button
            className="text-xs text-gray-500 hover:text-gray-200 px-1.5 py-0.5 rounded hover:bg-gray-700 transition-colors"
            title="Neue Seite"
            onClick={() => { setAddingPageIn('root'); setNewPageTitle('') }}
          >
            📄+
          </button>
        </div>
      </div>

      {/* Tree */}
      <div
        className="flex-1 overflow-y-auto p-2 flex flex-col gap-0.5"
        onDragOver={e => { e.preventDefault(); setDragOverId('root') }}
        onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverId(null) }}
        onDrop={e => {
          e.preventDefault()
          const pageId = e.dataTransfer.getData('pageId')
          if (pageId) movePage(pageId, undefined)
          setDragOverId(null)
        }}
      >
        {/* New folder input */}
        {addingFolder && (
          <div className="px-1 py-1">
            <input
              className="w-full bg-gray-700 text-gray-100 text-sm rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 border border-gray-600"
              placeholder="Ordnername..."
              value={newFolderTitle}
              autoFocus
              onChange={e => setNewFolderTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddFolder(); if (e.key === 'Escape') setAddingFolder(false) }}
              onBlur={() => setTimeout(() => setAddingFolder(false), 150)}
            />
          </div>
        )}

        {/* Folders */}
        {folders.map(renderFolder)}

        {/* Root pages */}
        <div
          className={`flex flex-col gap-0.5 rounded-lg min-h-[4px] ${dragOverId === 'root' ? 'bg-blue-900/20 ring-1 ring-blue-500/40' : ''}`}
        >
          {rootPages.map(renderPage)}
        </div>

        {/* New root page input */}
        {addingPageIn === 'root' && (
          <div className="px-1 py-1">
            <input
              className="w-full bg-gray-700 text-gray-100 text-sm rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 border border-gray-600"
              placeholder="Seitenname..."
              value={newPageTitle}
              autoFocus
              onChange={e => setNewPageTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddPage(undefined); if (e.key === 'Escape') setAddingPageIn(null) }}
              onBlur={() => setTimeout(() => setAddingPageIn(null), 150)}
            />
          </div>
        )}

        {folders.length === 0 && rootPages.length === 0 && !addingFolder && !addingPageIn && (
          <p className="text-xs text-gray-600 text-center py-6 px-2">
            Noch keine Seiten.<br />Erstelle eine Seite oder einen Ordner.
          </p>
        )}
      </div>
    </div>
  )
}
