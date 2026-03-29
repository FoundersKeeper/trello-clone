export interface Label {
  id: string
  name: string
  color: string
}

export interface ChecklistItem {
  id: string
  text: string
  completed: boolean
}

export interface Checklist {
  id: string
  title: string
  items: ChecklistItem[]
}

export interface Comment {
  id: string
  cardId: string
  text: string
  createdAt: string
}

export interface Attachment {
  id: string
  name: string
  size: number
  mimeType: string
  dataUrl: string
  createdAt: string
}

export interface Card {
  id: string
  listId: string
  title: string
  description: string
  dueDate: string | null
  completionDate: string | null
  isOverdue: boolean
  labels: Label[]
  assignees: string[]
  checklists: Checklist[]
  comments: Comment[]
  attachments: Attachment[]
  templateId?: string
  position: number
  createdAt: string
}

export interface List {
  id: string
  boardId: string
  title: string
  position: number
}

export interface Board {
  id: string
  title: string
  backgroundColor: string
  createdAt: string
}

export const LABEL_COLORS: { name: string; color: string }[] = [
  { name: 'Rot', color: '#ef4444' },
  { name: 'Orange', color: '#f97316' },
  { name: 'Gelb', color: '#eab308' },
  { name: 'Grün', color: '#22c55e' },
  { name: 'Blau', color: '#3b82f6' },
  { name: 'Lila', color: '#a855f7' },
  { name: 'Pink', color: '#ec4899' },
  { name: 'Grau', color: '#6b7280' },
]

export const BOARD_COLORS: string[] = [
  '#0079bf',
  '#d29034',
  '#519839',
  '#b04632',
  '#89609e',
  '#cd5a91',
  '#4bbf6b',
  '#00aecc',
  '#838c91',
]
