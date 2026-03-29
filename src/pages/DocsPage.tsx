import { Link, useParams } from 'react-router-dom'
import { useDocStore } from '../store/docStore'
import DocsSidebar from '../components/docs/DocsSidebar'
import DocEditor from '../components/docs/DocEditor'

export default function DocsPage() {
  const { pageId } = useParams<{ pageId?: string }>()
  const getPageById = useDocStore(s => s.getPageById)
  const pages = useDocStore(s => s.pages)

  const activePage = pageId ? getPageById(pageId) : undefined

  return (
    <div className="flex flex-col h-screen bg-gray-950">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 flex-shrink-0">
        <div className="px-4 py-3 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 4h7v11H4zM13 4h7v6h-7zM13 13h7v7h-7zM4 18h7v2H4z" />
              </svg>
            </div>
            <span className="font-bold text-white text-sm">Trello Clone</span>
          </Link>
          <span className="text-gray-600">/</span>
          <span className="text-sm font-medium text-gray-300">📝 Docs</span>
          {activePage && (
            <>
              <span className="text-gray-600">/</span>
              <span className="text-sm text-gray-400 truncate max-w-xs">{activePage.title}</span>
            </>
          )}
          <div className="ml-auto flex items-center gap-2 text-xs text-gray-500">
            <span>{pages.length} {pages.length === 1 ? 'Seite' : 'Seiten'}</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-60 bg-gray-900 border-r border-gray-800 flex-shrink-0 overflow-hidden flex flex-col">
          <DocsSidebar activePageId={pageId} />
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-hidden bg-gray-950">
          {activePage ? (
            <DocEditor page={activePage} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-8">
              <div className="text-6xl mb-4">📝</div>
              <h2 className="text-xl font-semibold text-gray-300 mb-2">Docs</h2>
              <p className="text-gray-500 text-sm max-w-sm">
                Wähle eine Seite aus der Sidebar oder erstelle eine neue mit dem <strong className="text-gray-400">📄+</strong> Button.
              </p>
              <p className="text-gray-600 text-xs mt-4">
                Tipp: Verlinke Seiten mit <code className="bg-gray-800 px-1 rounded">[[Seitenname]]</code>
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
