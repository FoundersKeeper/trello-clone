import { useState, useRef } from 'react'
import { format, isPast, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
import { useBoardStore } from '../../store/boardStore'
import { useDocStore } from '../../store/docStore'
import { LABEL_COLORS } from '../../types'
import type { Card, Label, Checklist, ChecklistItem, Attachment } from '../../types'
import { nanoid } from '../../utils/nanoid'
import DescriptionEditor from './DescriptionEditor'

interface Props {
  card: Card
  onClose: () => void
}

const MAX_FILE_BYTES = 5 * 1024 * 1024 // 5 MB

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / 1024 / 1024).toFixed(1)} MB`
}

export default function CardModal({ card, onClose }: Props) {
  const updateCard = useBoardStore(s => s.updateCard)
  const deleteCard = useBoardStore(s => s.deleteCard)
  const lists = useBoardStore(s => s.lists)
  // Always read fresh card from store so updates reflect immediately
  const liveCard = useBoardStore(s => s.cards.find(c => c.id === card.id)) ?? card
  const allDocPages = useDocStore(s => s.pages)
  const navigate = useNavigate()

  const [editingTitle, setEditingTitle] = useState(false)
  const [title, setTitle] = useState(liveCard.title)
  const [description, setDescription] = useState(liveCard.description)
  const [dueDate, setDueDate] = useState(liveCard.dueDate ? liveCard.dueDate.slice(0, 10) : '')
  const [showLabelPicker, setShowLabelPicker] = useState(false)
  const [newLabelName, setNewLabelName] = useState('')
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0].color)
  const [newChecklistTitle, setNewChecklistTitle] = useState('')
  const [addingChecklist, setAddingChecklist] = useState(false)
  const [newItemText, setNewItemText] = useState<Record<string, string>>({})
  const [attachError, setAttachError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [docSearch, setDocSearch] = useState('')
  const [showDocSearch, setShowDocSearch] = useState(false)

  const listName = lists.find(l => l.id === liveCard.listId)?.title ?? ''
  const isOverdue = liveCard.dueDate && !liveCard.completionDate && isPast(parseISO(liveCard.dueDate))

  // --- Title ---
  const saveTitle = () => {
    if (title.trim()) updateCard(liveCard.id, { title: title.trim() })
    setEditingTitle(false)
  }

  // --- Description ---
  const saveDescription = () => updateCard(liveCard.id, { description })

  // --- Due date ---
  const saveDueDate = (val: string) => {
    setDueDate(val)
    updateCard(liveCard.id, { dueDate: val ? new Date(val).toISOString() : null })
  }

  // --- Labels ---
  const addLabel = () => {
    if (!newLabelName.trim()) return
    const label: Label = { id: nanoid(), name: newLabelName.trim(), color: newLabelColor }
    updateCard(liveCard.id, { labels: [...liveCard.labels, label] })
    setNewLabelName('')
    setShowLabelPicker(false)
  }
  const removeLabel = (id: string) =>
    updateCard(liveCard.id, { labels: liveCard.labels.filter(l => l.id !== id) })

  // --- Checklists ---
  const addChecklist = () => {
    if (!newChecklistTitle.trim()) return
    const cl: Checklist = { id: nanoid(), title: newChecklistTitle.trim(), items: [] }
    updateCard(liveCard.id, { checklists: [...liveCard.checklists, cl] })
    setNewChecklistTitle('')
    setAddingChecklist(false)
  }
  const deleteChecklist = (clId: string) =>
    updateCard(liveCard.id, { checklists: liveCard.checklists.filter(c => c.id !== clId) })

  const addChecklistItem = (clId: string) => {
    const text = newItemText[clId]?.trim()
    if (!text) return
    const item: ChecklistItem = { id: nanoid(), text, completed: false }
    updateCard(liveCard.id, {
      checklists: liveCard.checklists.map(cl =>
        cl.id === clId ? { ...cl, items: [...cl.items, item] } : cl
      ),
    })
    setNewItemText(p => ({ ...p, [clId]: '' }))
  }
  const toggleChecklistItem = (clId: string, itemId: string) =>
    updateCard(liveCard.id, {
      checklists: liveCard.checklists.map(cl =>
        cl.id === clId
          ? { ...cl, items: cl.items.map(i => i.id === itemId ? { ...i, completed: !i.completed } : i) }
          : cl
      ),
    })
  const deleteChecklistItem = (clId: string, itemId: string) =>
    updateCard(liveCard.id, {
      checklists: liveCard.checklists.map(cl =>
        cl.id === clId ? { ...cl, items: cl.items.filter(i => i.id !== itemId) } : cl
      ),
    })

  // --- Attachments ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAttachError('')
    const files = Array.from(e.target.files ?? [])
    for (const file of files) {
      if (file.size > MAX_FILE_BYTES) {
        setAttachError(`"${file.name}" ist zu groß (max. 5 MB)`)
        continue
      }
      const reader = new FileReader()
      reader.onload = () => {
        const att: Attachment = {
          id: nanoid(),
          name: file.name,
          size: file.size,
          mimeType: file.type,
          dataUrl: reader.result as string,
          createdAt: new Date().toISOString(),
        }
        updateCard(liveCard.id, { attachments: [...(liveCard.attachments ?? []), att] })
      }
      reader.readAsDataURL(file)
    }
    e.target.value = ''
  }
  const removeAttachment = (id: string) =>
    updateCard(liveCard.id, { attachments: (liveCard.attachments ?? []).filter(a => a.id !== id) })

  const isImage = (mime: string) => mime.startsWith('image/')

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 pt-12 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl mb-8"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-3 px-5 pt-5 pb-3 border-b border-gray-700">
          <div className="flex-1">
            <p className="text-xs text-gray-500 mb-1">in Liste: <span className="text-gray-400">{listName}</span></p>
            {editingTitle ? (
              <input
                className="w-full text-xl font-bold bg-gray-700 text-gray-100 rounded px-2 py-0.5 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={title}
                onChange={e => setTitle(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') { setTitle(liveCard.title); setEditingTitle(false) } }}
                autoFocus
              />
            ) : (
              <h2
                className="text-xl font-bold text-gray-100 cursor-pointer hover:text-blue-400 transition-colors"
                onClick={() => setEditingTitle(true)}
                title="Klicken zum Bearbeiten"
              >
                {liveCard.title}
              </h2>
            )}
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-200 text-2xl leading-none mt-1 transition-colors">×</button>
        </div>

        <div className="p-5 flex flex-col gap-6">

          {/* Labels */}
          <section>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Labels</p>
            <div className="flex flex-wrap gap-2 mb-2">
              {liveCard.labels.map(label => (
                <span
                  key={label.id}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: label.color }}
                >
                  {label.name}
                  <button onClick={() => removeLabel(label.id)} className="hover:opacity-70 text-sm leading-none ml-0.5">×</button>
                </span>
              ))}
              <button
                onClick={() => setShowLabelPicker(p => !p)}
                className="px-2.5 py-1 rounded-full text-xs bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-gray-200 border border-gray-600 transition-colors"
              >
                + Label
              </button>
            </div>

            {showLabelPicker && (
              <div className="border border-gray-600 rounded-lg p-3 bg-gray-750 bg-gray-900/50 flex flex-col gap-3">
                <input
                  className="w-full rounded-lg border border-gray-600 bg-gray-700 text-gray-100 px-3 py-2 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Label-Name"
                  value={newLabelName}
                  onChange={e => setNewLabelName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addLabel()}
                  autoFocus
                />
                <div className="flex gap-2 flex-wrap">
                  {LABEL_COLORS.map(lc => (
                    <button
                      key={lc.color}
                      className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${newLabelColor === lc.color ? 'ring-2 ring-offset-2 ring-offset-gray-800 ring-white' : ''}`}
                      style={{ backgroundColor: lc.color }}
                      onClick={() => setNewLabelColor(lc.color)}
                      title={lc.name}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm px-3 py-1.5 rounded-lg font-medium transition-colors"
                    onClick={addLabel}
                    disabled={!newLabelName.trim()}
                  >Hinzufügen</button>
                  <button
                    className="text-gray-500 hover:text-gray-300 text-sm px-3 py-1.5"
                    onClick={() => setShowLabelPicker(false)}
                  >Abbrechen</button>
                </div>
              </div>
            )}
          </section>

          {/* Due Date */}
          <section>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Fälligkeitsdatum</p>
            <div className="flex items-center gap-3 flex-wrap">
              <input
                type="date"
                value={dueDate}
                onChange={e => saveDueDate(e.target.value)}
                className="rounded-lg border border-gray-600 bg-gray-700 text-gray-100 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {liveCard.dueDate && (
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${isOverdue ? 'bg-red-900/50 text-red-400' : liveCard.completionDate ? 'bg-green-900/40 text-green-400' : 'bg-gray-700 text-gray-300'}`}>
                  {isOverdue ? '🔴 Überfällig' : liveCard.completionDate ? '✅ Erledigt' : `📅 ${format(parseISO(liveCard.dueDate), 'd. MMM yyyy', { locale: de })}`}
                </span>
              )}
              {dueDate && (
                <button onClick={() => saveDueDate('')} className="text-xs text-gray-600 hover:text-red-400 transition-colors">
                  Entfernen
                </button>
              )}
            </div>
            {liveCard.completionDate && (
              <p className="text-xs text-gray-600 mt-1.5">
                Abgeschlossen am {format(parseISO(liveCard.completionDate), 'd. MMM yyyy', { locale: de })}
              </p>
            )}
          </section>

          {/* Description */}
          <section>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Beschreibung</p>
            <DescriptionEditor
              value={description}
              onChange={setDescription}
              onBlur={saveDescription}
            />
          </section>

          {/* Checklists */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Checklisten</p>
              <button
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                onClick={() => setAddingChecklist(p => !p)}
              >
                + Neue Checkliste
              </button>
            </div>

            {addingChecklist && (
              <div className="flex gap-2 mb-3">
                <input
                  className="flex-1 rounded-lg border border-gray-600 bg-gray-700 text-gray-100 px-3 py-1.5 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Checklisten-Titel"
                  value={newChecklistTitle}
                  onChange={e => setNewChecklistTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addChecklist(); if (e.key === 'Escape') setAddingChecklist(false) }}
                  autoFocus
                />
                <button
                  className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-3 py-1.5 rounded-lg font-medium transition-colors"
                  onClick={addChecklist}
                >Erstellen</button>
                <button
                  className="text-gray-500 hover:text-gray-300 text-lg leading-none px-1"
                  onClick={() => setAddingChecklist(false)}
                >✕</button>
              </div>
            )}

            {liveCard.checklists.map(cl => {
              const done = cl.items.filter(i => i.completed).length
              const total = cl.items.length
              const pct = total > 0 ? Math.round((done / total) * 100) : 0

              return (
                <div key={cl.id} className="mb-4 bg-gray-750 bg-gray-900/30 rounded-lg p-3 border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-200">☑ {cl.title}</span>
                    <button
                      className="text-xs text-gray-600 hover:text-red-400 transition-colors"
                      onClick={() => deleteChecklist(cl.id)}
                    >Löschen</button>
                  </div>

                  {total > 0 && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-gray-500 w-8">{pct}%</span>
                      <div className="flex-1 bg-gray-700 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${pct === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{done}/{total}</span>
                    </div>
                  )}

                  <div className="flex flex-col gap-1">
                    {cl.items.map(item => (
                      <div key={item.id} className="flex items-start gap-2 group/item">
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => toggleChecklistItem(cl.id, item.id)}
                          className="mt-0.5 w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500 cursor-pointer accent-blue-500 flex-shrink-0"
                        />
                        <span className={`flex-1 text-sm leading-snug ${item.completed ? 'line-through text-gray-600' : 'text-gray-200'}`}>
                          {item.text}
                        </span>
                        <button
                          className="text-gray-700 hover:text-red-400 text-xs opacity-0 group-hover/item:opacity-100 transition-all flex-shrink-0"
                          onClick={() => deleteChecklistItem(cl.id, item.id)}
                        >✕</button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 mt-2">
                    <input
                      className="flex-1 rounded border border-gray-600 bg-gray-700 text-gray-100 px-2 py-1 text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Neues Element..."
                      value={newItemText[cl.id] ?? ''}
                      onChange={e => setNewItemText(p => ({ ...p, [cl.id]: e.target.value }))}
                      onKeyDown={e => { if (e.key === 'Enter') addChecklistItem(cl.id) }}
                    />
                    <button
                      className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded border border-gray-600 transition-colors"
                      onClick={() => addChecklistItem(cl.id)}
                    >+</button>
                  </div>
                </div>
              )
            })}
          </section>

          {/* Attachments */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Anhänge</p>
              <button
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                + Datei anhängen
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {attachError && (
              <p className="text-xs text-red-400 mb-2">{attachError}</p>
            )}

            {(liveCard.attachments ?? []).length > 0 && (
              <div className="flex flex-col gap-2">
                {(liveCard.attachments ?? []).map(att => (
                  <div key={att.id} className="flex items-center gap-3 bg-gray-700 rounded-lg p-2.5 border border-gray-600 group/att">
                    {isImage(att.mimeType) ? (
                      <img
                        src={att.dataUrl}
                        alt={att.name}
                        className="w-12 h-10 object-cover rounded flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-10 bg-gray-600 rounded flex items-center justify-center flex-shrink-0 text-xl">
                        {att.mimeType.includes('pdf') ? '📄' : att.mimeType.includes('video') ? '🎬' : '📎'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-200 font-medium truncate">{att.name}</p>
                      <p className="text-xs text-gray-500">{formatBytes(att.size)}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <a
                        href={att.dataUrl}
                        download={att.name}
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        ↓
                      </a>
                      <button
                        className="text-gray-600 hover:text-red-400 text-xs transition-colors opacity-0 group-hover/att:opacity-100"
                        onClick={() => removeAttachment(att.id)}
                      >✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {(liveCard.attachments ?? []).length === 0 && (
              <button
                className="w-full border-2 border-dashed border-gray-700 hover:border-gray-500 rounded-lg py-4 text-sm text-gray-600 hover:text-gray-400 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                Datei hierher ziehen oder klicken zum Auswählen (max. 5 MB)
              </button>
            )}
          </section>

          {/* Docs */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Docs-Seiten</p>
              <button
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                onClick={() => setShowDocSearch(p => !p)}
              >
                + Seite verknüpfen
              </button>
            </div>

            {/* Linked pages */}
            {(liveCard.docPageIds ?? []).length > 0 && (
              <div className="flex flex-col gap-1.5 mb-2">
                {(liveCard.docPageIds ?? []).map(pid => {
                  const page = allDocPages.find(p => p.id === pid)
                  if (!page) return null
                  return (
                    <div key={pid} className="flex items-center gap-2 bg-gray-700 rounded-lg px-3 py-1.5 border border-gray-600 group/doc">
                      <span className="text-xs">📄</span>
                      <button
                        className="flex-1 text-sm text-blue-400 hover:text-blue-300 text-left truncate transition-colors"
                        onClick={() => { onClose(); navigate(`/docs/${page.id}`) }}
                      >
                        {page.title}
                      </button>
                      <button
                        className="text-gray-600 hover:text-red-400 text-xs opacity-0 group-hover/doc:opacity-100 transition-all"
                        onClick={() => updateCard(liveCard.id, { docPageIds: (liveCard.docPageIds ?? []).filter(id => id !== pid) })}
                      >✕</button>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Search dropdown */}
            {showDocSearch && (
              <div className="border border-gray-600 rounded-lg p-2 bg-gray-900/50 flex flex-col gap-1.5">
                <input
                  className="w-full rounded border border-gray-600 bg-gray-700 text-gray-100 px-2 py-1.5 text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Seite suchen…"
                  value={docSearch}
                  onChange={e => setDocSearch(e.target.value)}
                  autoFocus
                />
                <div className="flex flex-col gap-0.5 max-h-40 overflow-y-auto">
                  {allDocPages
                    .filter(p =>
                      p.title.toLowerCase().includes(docSearch.toLowerCase()) &&
                      !(liveCard.docPageIds ?? []).includes(p.id)
                    )
                    .map(p => (
                      <button
                        key={p.id}
                        className="text-left text-sm text-gray-300 hover:bg-gray-700 px-2 py-1.5 rounded transition-colors truncate"
                        onClick={() => {
                          updateCard(liveCard.id, { docPageIds: [...(liveCard.docPageIds ?? []), p.id] })
                          setDocSearch('')
                          setShowDocSearch(false)
                        }}
                      >
                        📄 {p.title}
                      </button>
                    ))
                  }
                  {allDocPages.filter(p =>
                    p.title.toLowerCase().includes(docSearch.toLowerCase()) &&
                    !(liveCard.docPageIds ?? []).includes(p.id)
                  ).length === 0 && (
                    <p className="text-xs text-gray-600 px-2 py-2 text-center">
                      {allDocPages.length === 0 ? 'Noch keine Docs-Seiten vorhanden.' : 'Keine passenden Seiten gefunden.'}
                    </p>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Footer */}
          <div className="flex justify-between pt-2 border-t border-gray-700">
            <button
              className="text-sm text-red-500 hover:text-red-400 transition-colors px-2 py-1"
              onClick={() => { deleteCard(liveCard.id); onClose() }}
            >
              Karte löschen
            </button>
            <button
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              onClick={onClose}
            >
              Schließen
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
