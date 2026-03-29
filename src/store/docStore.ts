import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from '../utils/nanoid'
import type { DocFolder, DocPage } from '../types'

interface DocState {
  folders: DocFolder[]
  pages: DocPage[]

  // Folder actions
  addFolder: (title: string) => DocFolder
  updateFolder: (id: string, data: Partial<DocFolder>) => void
  deleteFolder: (id: string) => void

  // Page actions
  addPage: (title: string, folderId?: string) => DocPage
  updatePage: (id: string, data: Partial<DocPage>) => void
  deletePage: (id: string) => void
  movePage: (pageId: string, targetFolderId: string | undefined) => void

  // Helpers
  getPagesByFolder: (folderId: string | undefined) => DocPage[]
  getPageById: (id: string) => DocPage | undefined
}

export const useDocStore = create<DocState>()(
  persist(
    (set, get) => ({
      folders: [],
      pages: [],

      addFolder: (title) => {
        const folder: DocFolder = { id: nanoid(), title, pageIds: [] }
        set(s => ({ folders: [...s.folders, folder] }))
        return folder
      },

      updateFolder: (id, data) =>
        set(s => ({
          folders: s.folders.map(f => (f.id === id ? { ...f, ...data } : f)),
        })),

      deleteFolder: (id) =>
        set(s => ({
          folders: s.folders.filter(f => f.id !== id),
          // Move pages from deleted folder to root
          pages: s.pages.map(p => (p.folderId === id ? { ...p, folderId: undefined } : p)),
        })),

      addPage: (title, folderId) => {
        const now = new Date().toISOString()
        const page: DocPage = {
          id: nanoid(),
          title,
          content: '',
          folderId,
          linkedPageIds: [],
          createdAt: now,
          updatedAt: now,
        }
        set(s => ({
          pages: [...s.pages, page],
          folders: folderId
            ? s.folders.map(f =>
                f.id === folderId ? { ...f, pageIds: [...f.pageIds, page.id] } : f
              )
            : s.folders,
        }))
        return page
      },

      updatePage: (id, data) =>
        set(s => ({
          pages: s.pages.map(p =>
            p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p
          ),
        })),

      deletePage: (id) =>
        set(s => ({
          pages: s.pages.filter(p => p.id !== id),
          folders: s.folders.map(f => ({
            ...f,
            pageIds: f.pageIds.filter(pid => pid !== id),
          })),
        })),

      movePage: (pageId, targetFolderId) =>
        set(s => {
          const page = s.pages.find(p => p.id === pageId)
          if (!page) return s
          return {
            pages: s.pages.map(p =>
              p.id === pageId ? { ...p, folderId: targetFolderId } : p
            ),
            folders: s.folders.map(f => {
              if (f.id === page.folderId) {
                return { ...f, pageIds: f.pageIds.filter(id => id !== pageId) }
              }
              if (f.id === targetFolderId) {
                return { ...f, pageIds: [...f.pageIds, pageId] }
              }
              return f
            }),
          }
        }),

      getPagesByFolder: (folderId) =>
        get().pages.filter(p => p.folderId === folderId),

      getPageById: (id) =>
        get().pages.find(p => p.id === id),
    }),
    { name: 'trello-clone-docs-storage' }
  )
)
