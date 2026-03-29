import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from '../utils/nanoid'
import type { Board, List, Card } from '../types'

interface BoardState {
  boards: Board[]
  lists: List[]
  cards: Card[]

  // Board actions
  addBoard: (title: string, backgroundColor: string) => Board
  updateBoard: (id: string, data: Partial<Board>) => void
  deleteBoard: (id: string) => void

  // List actions
  addList: (boardId: string, title: string) => List
  updateList: (id: string, data: Partial<List>) => void
  deleteList: (id: string) => void
  reorderLists: (boardId: string, orderedIds: string[]) => void

  // Card actions
  addCard: (listId: string, title: string) => Card
  updateCard: (id: string, data: Partial<Card>) => void
  deleteCard: (id: string) => void
  moveCard: (cardId: string, targetListId: string, position: number) => void
  reorderCards: (listId: string, orderedIds: string[]) => void

  // Computed helpers
  getListsByBoard: (boardId: string) => List[]
  getCardsByList: (listId: string) => Card[]
  getAllCardsWithDueDate: () => Card[]
}

export const useBoardStore = create<BoardState>()(
  persist(
    (set, get) => ({
      boards: [],
      lists: [],
      cards: [],

      addBoard: (title, backgroundColor) => {
        const board: Board = {
          id: nanoid(),
          title,
          backgroundColor,
          createdAt: new Date().toISOString(),
        }
        set(s => ({ boards: [...s.boards, board] }))
        // Add default Inbox list
        get().addList(board.id, 'Inbox')
        return board
      },

      updateBoard: (id, data) =>
        set(s => ({
          boards: s.boards.map(b => (b.id === id ? { ...b, ...data } : b)),
        })),

      deleteBoard: (id) =>
        set(s => {
          const listIds = s.lists.filter(l => l.boardId === id).map(l => l.id)
          return {
            boards: s.boards.filter(b => b.id !== id),
            lists: s.lists.filter(l => l.boardId !== id),
            cards: s.cards.filter(c => !listIds.includes(c.listId)),
          }
        }),

      addList: (boardId, title) => {
        const boardLists = get().lists.filter(l => l.boardId === boardId)
        const list: List = {
          id: nanoid(),
          boardId,
          title,
          position: boardLists.length,
        }
        set(s => ({ lists: [...s.lists, list] }))
        return list
      },

      updateList: (id, data) =>
        set(s => ({
          lists: s.lists.map(l => (l.id === id ? { ...l, ...data } : l)),
        })),

      deleteList: (id) =>
        set(s => ({
          lists: s.lists.filter(l => l.id !== id),
          cards: s.cards.filter(c => c.listId !== id),
        })),

      reorderLists: (boardId, orderedIds) =>
        set(s => ({
          lists: s.lists.map(l => {
            if (l.boardId !== boardId) return l
            const pos = orderedIds.indexOf(l.id)
            return pos >= 0 ? { ...l, position: pos } : l
          }),
        })),

      addCard: (listId, title) => {
        const listCards = get().cards.filter(c => c.listId === listId)
        const card: Card = {
          id: nanoid(),
          listId,
          title,
          description: '',
          dueDate: null,
          completionDate: null,
          isOverdue: false,
          labels: [],
          assignees: [],
          checklists: [],
          comments: [],
          attachments: [],
          position: listCards.length,
          createdAt: new Date().toISOString(),
        }
        set(s => ({ cards: [...s.cards, card] }))
        return card
      },

      updateCard: (id, data) =>
        set(s => ({
          cards: s.cards.map(c => {
            if (c.id !== id) return c
            const updated = { ...c, ...data }
            // Auto overdue flag
            if (updated.dueDate && !updated.completionDate) {
              updated.isOverdue = new Date(updated.dueDate) < new Date()
            } else {
              updated.isOverdue = false
            }
            return updated
          }),
        })),

      deleteCard: (id) =>
        set(s => ({ cards: s.cards.filter(c => c.id !== id) })),

      moveCard: (cardId, targetListId, position) =>
        set(s => {
          const card = s.cards.find(c => c.id === cardId)
          if (!card) return s

          const isDone = s.lists.find(l => l.id === targetListId)?.title.toLowerCase() === 'done' ||
            s.lists.find(l => l.id === targetListId)?.title.toLowerCase() === 'erledigt'

          return {
            cards: s.cards.map(c => {
              if (c.id !== cardId) return c
              return {
                ...c,
                listId: targetListId,
                position,
                completionDate: isDone && !c.completionDate ? new Date().toISOString() : c.completionDate,
                isOverdue: c.dueDate && !isDone ? new Date(c.dueDate) < new Date() : false,
              }
            }),
          }
        }),

      reorderCards: (listId, orderedIds) =>
        set(s => ({
          cards: s.cards.map(c => {
            if (c.listId !== listId) return c
            const pos = orderedIds.indexOf(c.id)
            return pos >= 0 ? { ...c, position: pos } : c
          }),
        })),

      getListsByBoard: (boardId) =>
        get()
          .lists.filter(l => l.boardId === boardId)
          .sort((a, b) => a.position - b.position),

      getCardsByList: (listId) =>
        get()
          .cards.filter(c => c.listId === listId)
          .sort((a, b) => a.position - b.position),

      getAllCardsWithDueDate: () =>
        get()
          .cards.filter(c => c.dueDate !== null)
          .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()),
    }),
    {
      name: 'trello-clone-storage',
    }
  )
)
