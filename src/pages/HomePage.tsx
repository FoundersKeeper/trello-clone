import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useBoardStore } from '../store/boardStore'
import CreateBoardModal from '../components/board/CreateBoardModal'
import type { Board } from '../types'

export default function HomePage() {
  const boards = useBoardStore(s => s.boards)
  const deleteBoard = useBoardStore(s => s.deleteBoard)
  const [showCreate, setShowCreate] = useState(false)
  const [editBoard, setEditBoard] = useState<Board | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 4h7v11H4zM13 4h7v6h-7zM13 13h7v7h-7zM4 18h7v2H4z" />
              </svg>
            </div>
            <span className="font-bold text-lg text-white">Trello Clone</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/planner" className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors">
              📅 Planner
            </Link>
            <Link to="/docs" className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors">
              📝 Docs
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Meine Boards</h1>
          <button
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            onClick={() => setShowCreate(true)}
          >
            <span className="text-lg leading-none">+</span> Neues Board
          </button>
        </div>

        {boards.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-gray-400 text-lg mb-4">Noch keine Boards vorhanden</p>
            <button
              className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
              onClick={() => setShowCreate(true)}
            >
              Erstes Board erstellen
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {boards.map(board => (
              <div key={board.id} className="group relative">
                <button
                  className="w-full h-28 rounded-xl text-white font-semibold text-left px-4 py-3 shadow-lg hover:brightness-110 transition-all"
                  style={{ backgroundColor: board.backgroundColor }}
                  onClick={() => navigate(`/board/${board.id}`)}
                >
                  {board.title}
                </button>

                {deleteConfirm === board.id ? (
                  <div className="absolute inset-0 bg-red-700 rounded-xl flex flex-col items-center justify-center gap-2 p-2">
                    <p className="text-white text-xs text-center font-medium">Board löschen?</p>
                    <div className="flex gap-1">
                      <button
                        className="bg-white text-red-700 text-xs px-2 py-1 rounded font-semibold"
                        onClick={() => { deleteBoard(board.id); setDeleteConfirm(null) }}
                      >Löschen</button>
                      <button
                        className="bg-white/20 text-white text-xs px-2 py-1 rounded"
                        onClick={() => setDeleteConfirm(null)}
                      >Abbruch</button>
                    </div>
                  </div>
                ) : (
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Edit button */}
                    <button
                      className="w-7 h-7 bg-black/30 hover:bg-black/60 rounded text-white text-sm flex items-center justify-center transition-colors"
                      onClick={e => { e.stopPropagation(); setEditBoard(board) }}
                      title="Board bearbeiten"
                    >
                      ✎
                    </button>
                    {/* Delete button */}
                    <button
                      className="w-7 h-7 bg-black/30 hover:bg-black/60 rounded text-white text-sm flex items-center justify-center transition-colors"
                      onClick={e => { e.stopPropagation(); setDeleteConfirm(board.id) }}
                      title="Board löschen"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            ))}

            <button
              className="h-28 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 font-medium transition-colors flex items-center justify-center gap-2 border border-gray-700 hover:border-gray-600"
              onClick={() => setShowCreate(true)}
            >
              <span className="text-xl">+</span> Neues Board
            </button>
          </div>
        )}
      </main>

      {/* Create modal */}
      <CreateBoardModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={id => navigate(`/board/${id}`)}
      />

      {/* Edit modal */}
      {editBoard && (
        <CreateBoardModal
          open={true}
          onClose={() => setEditBoard(null)}
          board={editBoard}
        />
      )}
    </div>
  )
}
