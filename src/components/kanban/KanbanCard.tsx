import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { format, isPast, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import type { Card } from '../../types'
import CardModal from '../card/CardModal'
import { useBoardStore } from '../../store/boardStore'
import { useDocStore } from '../../store/docStore'

interface Props {
  card: Card
}

export default function KanbanCard({ card }: Props) {
  const [showModal, setShowModal] = useState(false)
  const navigate = useNavigate()
  const lists = useBoardStore(s => s.lists)
  const allDocPages = useDocStore(s => s.pages)
  const cards = useBoardStore(s => s.cards)
  const moveCard = useBoardStore(s => s.moveCard)

  const currentList = lists.find(l => l.id === card.listId)
  const boardLists = lists
    .filter(l => l.boardId === currentList?.boardId)
    .sort((a, b) => a.position - b.position)
  const currentIndex = boardLists.findIndex(l => l.id === card.listId)
  const prevList = currentIndex > 0 ? boardLists[currentIndex - 1] : null
  const nextList = currentIndex < boardLists.length - 1 ? boardLists[currentIndex + 1] : null

  const handleMoveLeft = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!prevList) return
    const targetCards = cards.filter(c => c.listId === prevList.id)
    moveCard(card.id, prevList.id, targetCards.length)
  }

  const handleMoveRight = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!nextList) return
    const targetCards = cards.filter(c => c.listId === nextList.id)
    moveCard(card.id, nextList.id, targetCards.length)
  }

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: 'card', card },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const isOverdue = card.dueDate && !card.completionDate && isPast(parseISO(card.dueDate))

  const totalItems = card.checklists.reduce((s, cl) => s + cl.items.length, 0)
  const doneItems = card.checklists.reduce((s, cl) => s + cl.items.filter(i => i.completed).length, 0)

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className="bg-gray-700 rounded-lg border border-gray-600 hover:border-gray-400 p-3 cursor-pointer hover:bg-gray-650 transition-all group select-none"
        onClick={() => setShowModal(true)}
        {...attributes}
        {...listeners}
      >
        {/* Label strips */}
        {card.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {card.labels.map(label => (
              <span
                key={label.id}
                className="h-1.5 w-9 rounded-full opacity-90"
                style={{ backgroundColor: label.color }}
                title={label.name}
              />
            ))}
          </div>
        )}

        <p className="text-sm font-medium text-gray-100 leading-snug">{card.title}</p>

        {/* Meta row */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {card.description && (
            <span className="text-gray-500 text-xs" title="Hat Beschreibung">≡</span>
          )}
          {card.attachments?.length > 0 && (
            <span className="text-gray-500 text-xs" title="Hat Anhänge">📎 {card.attachments.length}</span>
          )}
          {totalItems > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${doneItems === totalItems ? 'bg-green-900/40 text-green-400' : 'bg-gray-600 text-gray-300'}`}>
              ✓ {doneItems}/{totalItems}
            </span>
          )}
          {card.dueDate && (
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${isOverdue ? 'bg-red-900/50 text-red-400' : card.completionDate ? 'bg-green-900/40 text-green-400' : 'bg-gray-600 text-gray-300'}`}>
              {isOverdue ? '🔴' : card.completionDate ? '✅' : '📅'} {format(parseISO(card.dueDate), 'd. MMM', { locale: de })}
            </span>
          )}
        </div>

        {/* Doc links */}
        {(card.docPageIds ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {(card.docPageIds ?? []).map(pid => {
              const page = allDocPages.find(p => p.id === pid)
              if (!page) return null
              return (
                <button
                  key={pid}
                  className="text-xs text-blue-400 hover:text-blue-300 bg-blue-900/20 hover:bg-blue-900/40 px-1.5 py-0.5 rounded transition-colors truncate max-w-[120px]"
                  title={`Docs: ${page.title}`}
                  onClick={e => { e.stopPropagation(); navigate(`/docs/${page.id}`) }}
                >
                  📄 {page.title}
                </button>
              )
            })}
          </div>
        )}

        {/* Move arrows */}
        <div className="flex justify-between mt-2">
          <button
            className={`text-xs px-1.5 py-0.5 rounded transition-colors ${prevList ? 'text-gray-400 hover:text-gray-100 hover:bg-gray-600' : 'text-gray-700 cursor-default'}`}
            onClick={handleMoveLeft}
            disabled={!prevList}
            title={prevList ? `Nach "${prevList.title}" verschieben` : ''}
          >
            ← {prevList?.title ?? ''}
          </button>
          <button
            className={`text-xs px-1.5 py-0.5 rounded transition-colors ${nextList ? 'text-gray-400 hover:text-gray-100 hover:bg-gray-600' : 'text-gray-700 cursor-default'}`}
            onClick={handleMoveRight}
            disabled={!nextList}
            title={nextList ? `Nach "${nextList.title}" verschieben` : ''}
          >
            {nextList?.title ?? ''} →
          </button>
        </div>
      </div>

      {showModal && <CardModal card={card} onClose={() => setShowModal(false)} />}
    </>
  )
}
