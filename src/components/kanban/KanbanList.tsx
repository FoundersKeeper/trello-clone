import { useState, useRef } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useBoardStore } from '../../store/boardStore'
import type { List } from '../../types'
import KanbanCard from './KanbanCard'

interface Props {
  list: List
}

export default function KanbanList({ list }: Props) {
  const cards = useBoardStore(s => s.getCardsByList(list.id))
  const addCard = useBoardStore(s => s.addCard)
  const updateList = useBoardStore(s => s.updateList)
  const deleteList = useBoardStore(s => s.deleteList)

  const [addingCard, setAddingCard] = useState(false)
  const [newCardTitle, setNewCardTitle] = useState('')
  const [editingTitle, setEditingTitle] = useState(false)
  const [listTitle, setListTitle] = useState(list.title)
  const [showMenu, setShowMenu] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const { attributes, listeners, setNodeRef: setSortableRef, transform, transition, isDragging } = useSortable({
    id: list.id,
    data: { type: 'list' },
  })

  const { setNodeRef: setDropRef } = useDroppable({ id: list.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleAddCard = () => {
    if (!newCardTitle.trim()) { setAddingCard(false); return }
    addCard(list.id, newCardTitle.trim())
    setNewCardTitle('')
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const handleSaveTitle = () => {
    if (listTitle.trim()) updateList(list.id, { title: listTitle.trim() })
    else setListTitle(list.title)
    setEditingTitle(false)
  }

  return (
    <div ref={setSortableRef} style={style} className="flex-shrink-0 w-72">
      <div className="bg-gray-800 rounded-xl flex flex-col max-h-[calc(100vh-9rem)]">
        {/* Header */}
        <div
          className="flex items-center justify-between px-3 py-2.5 cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          {editingTitle ? (
            <input
              className="flex-1 text-sm font-semibold bg-gray-700 text-gray-100 rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-600"
              value={listTitle}
              onChange={e => setListTitle(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSaveTitle()
                if (e.key === 'Escape') { setListTitle(list.title); setEditingTitle(false) }
              }}
              autoFocus
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <h3
              className="text-sm font-semibold text-gray-200 flex-1"
              onDoubleClick={e => { e.stopPropagation(); setEditingTitle(true) }}
            >
              {list.title}
              <span className="ml-2 text-xs text-gray-500 font-normal">{cards.length}</span>
            </h3>
          )}

          <div className="relative ml-2">
            <button
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-700 text-gray-500 hover:text-gray-300 text-lg leading-none"
              onClick={e => { e.stopPropagation(); setShowMenu(!showMenu) }}
            >
              ···
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-7 z-20 bg-gray-750 bg-gray-700 rounded-lg shadow-xl border border-gray-600 py-1 w-44">
                  <button
                    className="w-full text-left text-sm px-3 py-2 hover:bg-gray-600 text-gray-200"
                    onClick={() => { setEditingTitle(true); setShowMenu(false) }}
                  >
                    Umbenennen
                  </button>
                  <button
                    className="w-full text-left text-sm px-3 py-2 hover:bg-gray-600 text-red-400"
                    onClick={() => { deleteList(list.id); setShowMenu(false) }}
                  >
                    Liste löschen
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Cards */}
        <div ref={setDropRef} className="flex-1 overflow-y-auto scrollbar-thin px-2 pb-2 flex flex-col gap-2 min-h-[2px]">
          <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
            {cards.map(card => (
              <KanbanCard key={card.id} card={card} />
            ))}
          </SortableContext>
        </div>

        {/* Add card */}
        <div className="px-2 pb-2">
          {addingCard ? (
            <div className="flex flex-col gap-2">
              <input
                ref={inputRef}
                className="w-full rounded-lg border border-gray-600 bg-gray-700 text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
                placeholder="Kartentitel eingeben..."
                value={newCardTitle}
                onChange={e => setNewCardTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddCard()
                  if (e.key === 'Escape') { setAddingCard(false); setNewCardTitle('') }
                }}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-3 py-1.5 rounded-lg font-medium transition-colors"
                  onClick={handleAddCard}
                >
                  Hinzufügen
                </button>
                <button
                  className="text-gray-500 hover:text-gray-300 text-lg leading-none px-2"
                  onClick={() => { setAddingCard(false); setNewCardTitle('') }}
                >
                  ✕
                </button>
              </div>
            </div>
          ) : (
            <button
              className="w-full text-left text-sm text-gray-500 hover:text-gray-300 hover:bg-gray-700 rounded-lg px-3 py-2 transition-colors"
              onClick={() => setAddingCard(true)}
            >
              + Karte hinzufügen
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
