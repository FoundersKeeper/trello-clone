import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useBoardStore } from '../store/boardStore'
import KanbanBoard from '../components/kanban/KanbanBoard'
import CreateBoardModal from '../components/board/CreateBoardModal'

export default function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>()
  const board = useBoardStore(s => s.boards.find(b => b.id === boardId))
  const updateBoard = useBoardStore(s => s.updateBoard)
  const navigate = useNavigate()

  const [editingTitle, setEditingTitle] = useState(false)
  const [title, setTitle] = useState(board?.title ?? '')
  const [showEdit, setShowEdit] = useState(false)

  if (!board) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Board nicht gefunden</p>
          <Link to="/" className="text-blue-400 hover:underline">Zurück zur Übersicht</Link>
        </div>
      </div>
    )
  }

  const saveTitle = () => {
    if (title.trim()) updateBoard(board.id, { title: title.trim() })
    else setTitle(board.title)
    setEditingTitle(false)
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: board.backgroundColor }}>
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm px-4 py-2 flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="text-white/80 hover:text-white text-sm flex items-center gap-1 transition-colors flex-shrink-0"
        >
          ← Home
        </button>

        <div className="flex-1 min-w-0">
          {editingTitle ? (
            <input
              className="bg-white/20 text-white placeholder-white/60 rounded px-2 py-0.5 text-lg font-bold focus:outline-none focus:bg-white/30 w-64"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={e => {
                if (e.key === 'Enter') saveTitle()
                if (e.key === 'Escape') { setTitle(board.title); setEditingTitle(false) }
              }}
              autoFocus
            />
          ) : (
            <h1
              className="text-lg font-bold text-white cursor-pointer hover:bg-white/10 rounded px-2 py-0.5 inline-block"
              onClick={() => setEditingTitle(true)}
              title="Klicken zum Umbenennen"
            >
              {board.title}
            </h1>
          )}
        </div>

        {/* Board settings */}
        <button
          onClick={() => setShowEdit(true)}
          className="text-white/70 hover:text-white text-sm flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
          title="Board-Einstellungen"
        >
          ⚙ Einstellungen
        </button>

        <Link
          to="/planner"
          className="text-white/80 hover:text-white text-sm transition-colors flex-shrink-0"
        >
          📅 Planner
        </Link>
      </header>

      {/* Board content */}
      <main className="flex-1 p-4 overflow-hidden">
        <KanbanBoard board={board} />
      </main>

      <CreateBoardModal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        board={board}
      />
    </div>
  )
}
