import { useState } from 'react'
import Modal from '../ui/Modal'
import { BOARD_COLORS } from '../../types'
import { useBoardStore } from '../../store/boardStore'
import type { Board } from '../../types'

interface Props {
  open: boolean
  onClose: () => void
  /** Wenn übergeben → Edit-Modus, sonst Erstellen-Modus */
  board?: Board
  onCreated?: (boardId: string) => void
}

function isValidHex(val: string) {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(val)
}

export default function CreateBoardModal({ open, onClose, board, onCreated }: Props) {
  const isEdit = !!board
  const [title, setTitle] = useState(board?.title ?? '')
  const [color, setColor] = useState(board?.backgroundColor ?? BOARD_COLORS[0])
  const [customHex, setCustomHex] = useState('')
  const [hexError, setHexError] = useState('')

  const addBoard = useBoardStore(s => s.addBoard)
  const updateBoard = useBoardStore(s => s.updateBoard)

  const applyCustomHex = () => {
    const val = customHex.startsWith('#') ? customHex : `#${customHex}`
    if (isValidHex(val)) {
      setColor(val)
      setHexError('')
    } else {
      setHexError('Ungültiger Farbcode (z.B. #3b82f6)')
    }
  }

  const handleSubmit = () => {
    if (!title.trim()) return
    if (isEdit) {
      updateBoard(board!.id, { title: title.trim(), backgroundColor: color })
    } else {
      const created = addBoard(title.trim(), color)
      onCreated?.(created.id)
    }
    onClose()
  }

  // Reset state when modal opens
  const handleClose = () => {
    if (!isEdit) { setTitle(''); setColor(BOARD_COLORS[0]) }
    setCustomHex('')
    setHexError('')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEdit ? 'Board bearbeiten' : 'Neues Board erstellen'}
      size="sm"
    >
      <div className="flex flex-col gap-4">
        {/* Preview */}
        <div
          className="w-full h-24 rounded-lg flex items-center justify-center text-white font-semibold text-lg shadow-inner transition-colors"
          style={{ backgroundColor: color }}
        >
          {title || 'Board-Name'}
        </div>

        {/* Title */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-400">Board-Name</label>
          <input
            className="w-full rounded-lg border border-gray-600 bg-gray-700 text-gray-100 px-3 py-2 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="z.B. Projekt Alpha"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            autoFocus={!isEdit}
          />
        </div>

        {/* Color picker */}
        <div>
          <p className="text-sm font-medium text-gray-400 mb-2">Hintergrundfarbe</p>

          {/* Preset swatches */}
          <div className="flex gap-2 flex-wrap mb-3">
            {BOARD_COLORS.map(c => (
              <button
                key={c}
                className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${color === c ? 'ring-2 ring-offset-2 ring-offset-gray-800 ring-white' : ''}`}
                style={{ backgroundColor: c }}
                onClick={() => { setColor(c); setCustomHex('') }}
              />
            ))}

            {/* Native color picker */}
            <div className="relative w-8 h-8" title="Farbe wählen">
              <div
                className={`w-8 h-8 rounded-full border-2 border-dashed border-gray-500 hover:border-gray-300 transition-colors cursor-pointer overflow-hidden flex items-center justify-center text-gray-400 text-xs`}
                style={!BOARD_COLORS.includes(color) ? { backgroundColor: color, borderStyle: 'solid', borderColor: 'white' } : {}}
              >
                {BOARD_COLORS.includes(color) ? '＋' : ''}
              </div>
              <input
                type="color"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                value={color}
                onChange={e => { setColor(e.target.value); setCustomHex(e.target.value) }}
                title="Farbauswahl"
              />
            </div>
          </div>

          {/* Custom hex input */}
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm select-none">#</span>
              <input
                className="w-full rounded-lg border border-gray-600 bg-gray-700 text-gray-100 pl-7 pr-3 py-1.5 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                placeholder="3b82f6"
                value={customHex.replace(/^#/, '')}
                onChange={e => {
                  setCustomHex(e.target.value)
                  setHexError('')
                  const val = `#${e.target.value}`
                  if (isValidHex(val)) setColor(val)
                }}
                onKeyDown={e => e.key === 'Enter' && applyCustomHex()}
                maxLength={7}
              />
            </div>
            <div
              className="w-8 h-8 rounded-lg border border-gray-600 flex-shrink-0"
              style={{ backgroundColor: isValidHex(`#${customHex.replace(/^#/, '')}`) ? `#${customHex.replace(/^#/, '')}` : color }}
            />
          </div>
          {hexError && <p className="text-xs text-red-400 mt-1">{hexError}</p>}
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-2">
          <button
            className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
            onClick={handleClose}
          >
            Abbrechen
          </button>
          <button
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            onClick={handleSubmit}
            disabled={!title.trim()}
          >
            {isEdit ? 'Speichern' : 'Erstellen'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
