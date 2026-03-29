import { Link } from 'react-router-dom'
import { format, parseISO, isToday, isTomorrow, isPast, startOfDay, addDays } from 'date-fns'
import { de } from 'date-fns/locale'
import { useBoardStore } from '../store/boardStore'
import type { Card } from '../types'

function groupCardsByDate(cards: Card[]) {
  const groups: Record<string, typeof cards> = {}
  for (const card of cards) {
    const key = card.dueDate!.slice(0, 10)
    if (!groups[key]) groups[key] = []
    groups[key].push(card)
  }
  return groups
}

function dateLabel(dateStr: string): string {
  const d = parseISO(dateStr)
  if (isToday(d)) return 'Heute'
  if (isTomorrow(d)) return 'Morgen'
  return format(d, 'EEEE, d. MMMM yyyy', { locale: de })
}

export default function PlannerPage() {
  const cards = useBoardStore(s => s.getAllCardsWithDueDate())
  const boards = useBoardStore(s => s.boards)
  const lists = useBoardStore(s => s.lists)

  const grouped = groupCardsByDate(cards)
  const sortedDates = Object.keys(grouped).sort()

  const getBoardForCard = (listId: string) => {
    const list = lists.find(l => l.id === listId)
    if (!list) return null
    return boards.find(b => b.id === list.boardId) ?? null
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link to="/" className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm">
            ← Home
          </Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">📅 Planner</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {sortedDates.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📅</div>
            <p className="text-gray-500 dark:text-gray-400 text-lg">Keine Karten mit Fälligkeitsdatum</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Füge Fälligkeitsdaten zu Karten hinzu, um sie hier zu sehen</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {sortedDates.map(dateStr => {
              const dayCards = grouped[dateStr]
              const isOverdueGroup = isPast(startOfDay(addDays(parseISO(dateStr), 1)))
              return (
                <div key={dateStr}>
                  <div className="flex items-center gap-3 mb-3">
                    <h2 className={`font-semibold text-sm uppercase tracking-wide ${isOverdueGroup ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      {isOverdueGroup && !isToday(parseISO(dateStr)) ? '🔴 ' : ''}{dateLabel(dateStr)}
                    </h2>
                    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                    <span className="text-xs text-gray-400">{dayCards.length} {dayCards.length === 1 ? 'Karte' : 'Karten'}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {dayCards.map(card => {
                      const board = getBoardForCard(card.listId)
                      const list = lists.find(l => l.id === card.listId)
                      const cardOverdue = card.dueDate && !card.completionDate && isPast(parseISO(card.dueDate))
                      return (
                        <div
                          key={card.id}
                          className="bg-white dark:bg-gray-800 rounded-xl px-4 py-3 shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-3"
                        >
                          <div className={`w-1 self-stretch rounded-full flex-shrink-0`} style={{ backgroundColor: board?.backgroundColor ?? '#6b7280' }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{card.title}</p>
                            <p className="text-xs text-gray-400 truncate">
                              {board?.title} › {list?.title}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {card.labels.map(l => (
                              <span key={l.id} className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} title={l.name} />
                            ))}
                            {cardOverdue && <span className="text-xs text-red-500 font-medium">Überfällig</span>}
                            {card.completionDate && <span className="text-xs text-green-600 dark:text-green-400 font-medium">✅ Erledigt</span>}
                          </div>
                          {board && (
                            <Link
                              to={`/board/${board.id}`}
                              className="text-xs text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 flex-shrink-0"
                            >
                              Öffnen →
                            </Link>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
