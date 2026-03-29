import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  closestCorners,
} from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { useBoardStore } from '../../store/boardStore'
import type { Board, Card } from '../../types'
import KanbanList from './KanbanList'
import KanbanCard from './KanbanCard'

interface Props {
  board: Board
}

export default function KanbanBoard({ board }: Props) {
  const lists = useBoardStore(s => s.getListsByBoard(board.id))
  const cards = useBoardStore(s => s.cards)
  const addList = useBoardStore(s => s.addList)
  const reorderLists = useBoardStore(s => s.reorderLists)
  const moveCard = useBoardStore(s => s.moveCard)
  const reorderCards = useBoardStore(s => s.reorderCards)

  const [addingList, setAddingList] = useState(false)
  const [newListTitle, setNewListTitle] = useState('')
  const [activeCard, setActiveCard] = useState<Card | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const { data } = event.active
    if (data.current?.type === 'card') {
      setActiveCard(data.current.card)
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    if (activeId === overId) return

    const activeData = active.data.current
    if (activeData?.type !== 'card') return

    // Check if over a list directly
    const overList = lists.find(l => l.id === overId)
    if (overList) {
      const listCards = cards.filter(c => c.listId === overId).sort((a, b) => a.position - b.position)
      moveCard(activeId, overId, listCards.length)
      return
    }

    // Over another card
    const overCard = cards.find(c => c.id === overId)
    if (overCard && overCard.listId !== activeData.card?.listId) {
      moveCard(activeId, overCard.listId, overCard.position)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveCard(null)
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string
    const activeData = active.data.current

    if (activeData?.type === 'list') {
      if (activeId !== overId) {
        const listIds = lists.map(l => l.id)
        const oldIndex = listIds.indexOf(activeId)
        const newIndex = listIds.indexOf(overId)
        if (oldIndex !== -1 && newIndex !== -1) {
          const reordered = [...listIds]
          reordered.splice(oldIndex, 1)
          reordered.splice(newIndex, 0, activeId)
          reorderLists(board.id, reordered)
        }
      }
      return
    }

    if (activeData?.type === 'card') {
      const activeCard = cards.find(c => c.id === activeId)
      if (!activeCard) return

      const overCard = cards.find(c => c.id === overId)
      if (overCard && overCard.listId === activeCard.listId) {
        // Reorder within same list
        const listCards = cards.filter(c => c.listId === activeCard.listId).sort((a, b) => a.position - b.position)
        const ids = listCards.map(c => c.id)
        const oldIdx = ids.indexOf(activeId)
        const newIdx = ids.indexOf(overId)
        if (oldIdx !== -1 && newIdx !== -1) {
          const reordered = [...ids]
          reordered.splice(oldIdx, 1)
          reordered.splice(newIdx, 0, activeId)
          reorderCards(activeCard.listId, reordered)
        }
      }
    }
  }

  const handleAddList = () => {
    if (!newListTitle.trim()) { setAddingList(false); return }
    addList(board.id, newListTitle.trim())
    setNewListTitle('')
    setAddingList(false)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 items-start overflow-x-auto pb-4 scrollbar-thin">
        <SortableContext items={lists.map(l => l.id)} strategy={horizontalListSortingStrategy}>
          {lists.map(list => (
            <KanbanList key={list.id} list={list} />
          ))}
        </SortableContext>

        {/* Add list */}
        {addingList ? (
          <div className="flex-shrink-0 w-72 bg-gray-200 dark:bg-gray-800 rounded-xl p-3 flex flex-col gap-2">
            <input
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Listenname eingeben..."
              value={newListTitle}
              onChange={e => setNewListTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddList(); if (e.key === 'Escape') { setAddingList(false); setNewListTitle('') } }}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded-lg font-medium"
                onClick={handleAddList}
              >
                Liste hinzufügen
              </button>
              <button
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm px-2 py-1"
                onClick={() => { setAddingList(false); setNewListTitle('') }}
              >
                ✕
              </button>
            </div>
          </div>
        ) : (
          <button
            className="flex-shrink-0 w-72 bg-white/30 dark:bg-gray-800/50 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-xl p-3 text-sm font-medium text-white/90 dark:text-gray-300 text-left transition-colors"
            onClick={() => setAddingList(true)}
          >
            + Liste hinzufügen
          </button>
        )}
      </div>

      <DragOverlay>
        {activeCard && (
          <div className="rotate-2 scale-105">
            <KanbanCard card={activeCard} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
