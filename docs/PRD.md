# Trello Clone – Product Requirements Document

## Vision
A lightweight, fast Kanban board app that mirrors Trello's core experience
without unnecessary complexity.

---

## Tech Stack
- Frontend: React + TypeScript
- Styling: Tailwind CSS
- State: Zustand (lightweight state management)
- Storage: localStorage (Phase 1), Supabase (Phase 2)
- Drag & Drop: @dnd-kit/core

---

## Core Features

### Boards
- Multiple boards per user
- Board title + background color
- Archive & delete boards

### Lists (Columns)
- Customizable list names
- Reorder lists via drag & drop
- Add/delete lists
- Special: "Inbox" list always present for quick capture

### Cards
- Title (required)
- Description (markdown supported)
- Due date + overdue flag 🔴
- Labels (color + name)
- Checklists with checkboxes
- Assignees
- Comments
- Completion date (auto-set when moved to Done)
- Card templates for recurring tasks

### Views
- Kanban Board (default)
- Planner View – cards aggregated across boards by due date
- Filter by: label / assignee / due date

### Automations
- Card moved to "Done" → completion date auto-added
- Overdue cards flagged with 🔴

### Summaries
- Daily & weekly activity summary per board

---

## Data Model

```typescript
Board {
  id, title, backgroundColor, lists[], createdAt
}

List {
  id, boardId, title, position, cards[]
}

Card {
  id, listId, title, description,
  dueDate, completionDate, isOverdue,
  labels[], assignees[], checklists[],
  comments[], templateId?, createdAt
}

Label { id, name, color }
Checklist { id, title, items[] }
ChecklistItem { id, text, completed }
Comment { id, cardId, text, createdAt }
```

---

## Phase 1 – MVP (localStorage)
- [ ] Board CRUD
- [ ] List CRUD + reorder
- [ ] Card CRUD + drag & drop between lists
- [ ] Labels & due dates
- [ ] Overdue flagging
- [ ] Inbox list
- [ ] Planner view

## Phase 2 – Extended
- [ ] Supabase backend + auth
- [ ] Assignees & comments
- [ ] Automations
- [ ] Card templates
- [ ] Export to JSON
- [ ] Daily/weekly summaries

---

## UI Guidelines
- Clean, minimal – Trello-inspired but faster
- Dark mode support
- Mobile responsive
- Smooth drag & drop animations
