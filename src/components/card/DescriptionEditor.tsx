import { useRef, useState, type KeyboardEvent } from 'react'

interface Props {
  value: string
  onChange: (v: string) => void
  onBlur: () => void
}

function renderPreview(text: string): string {
  if (!text.trim()) return ''
  const lines = text.split('\n')
  const result: string[] = []
  let inList = false

  for (const raw of lines) {
    let line = raw
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.+?)__/g, '<strong>$1</strong>')
      .replace(/\*([^*]+?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+?)`/g, '<code class="bg-gray-700 text-blue-300 px-1 rounded text-xs font-mono">$1</code>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-400 underline hover:text-blue-300">$1</a>')
      .replace(/(^|[\s(])(https?:\/\/[^\s<>"']+)/g, '$1<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-400 underline hover:text-blue-300">$2</a>')

    if (/^[-*] /.test(raw)) {
      if (!inList) { result.push('<ul class="list-disc list-inside space-y-0.5 my-1 text-gray-200">'); inList = true }
      result.push(`<li>${line.replace(/^[-*] /, '')}</li>`)
    } else {
      if (inList) { result.push('</ul>'); inList = false }
      result.push(line === '' ? '<div class="h-2"></div>' : `<p class="min-h-[1.25em]">${line}</p>`)
    }
  }
  if (inList) result.push('</ul>')
  return result.join('')
}

function insertAtCursor(
  textarea: HTMLTextAreaElement,
  before: string,
  after = '',
  defaultText = ''
): { newValue: string; newCursor: number } {
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selected = textarea.value.slice(start, end) || defaultText
  const newValue = textarea.value.slice(0, start) + before + selected + after + textarea.value.slice(end)
  return { newValue, newCursor: start + before.length + selected.length }
}

export default function DescriptionEditor({ value, onChange, onBlur }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [showPreview, setShowPreview] = useState(false)

  const applyFormat = (type: 'bold' | 'italic' | 'bullet' | 'link' | 'code') => {
    const ta = textareaRef.current
    if (!ta) return
    let result: { newValue: string; newCursor: number }

    if (type === 'bullet') {
      const start = ta.selectionStart
      const end = ta.selectionEnd
      const lines = ta.value.slice(start, end).split('\n')
      const prefixed = lines.map(l => (l.startsWith('- ') ? l : `- ${l}`)).join('\n')
      result = { newValue: ta.value.slice(0, start) + prefixed + ta.value.slice(end), newCursor: start + prefixed.length }
    } else if (type === 'bold') {
      result = insertAtCursor(ta, '**', '**', 'fetter Text')
    } else if (type === 'italic') {
      result = insertAtCursor(ta, '*', '*', 'kursiver Text')
    } else if (type === 'code') {
      result = insertAtCursor(ta, '`', '`', 'code')
    } else {
      result = insertAtCursor(ta, '[', '](https://)', 'Link-Text')
    }

    onChange(result.newValue)
    setTimeout(() => {
      ta.focus()
      ta.setSelectionRange(result.newCursor, result.newCursor)
    }, 0)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const ta = e.currentTarget
      const start = ta.selectionStart
      onChange(ta.value.slice(0, start) + '  ' + ta.value.slice(ta.selectionEnd))
      setTimeout(() => ta.setSelectionRange(start + 2, start + 2), 0)
    }
    if (e.key === 'Enter') {
      const ta = e.currentTarget
      const lineStart = ta.value.lastIndexOf('\n', ta.selectionStart - 1) + 1
      const currentLine = ta.value.slice(lineStart, ta.selectionStart)
      if (/^[-*] /.test(currentLine)) {
        e.preventDefault()
        const ins = '\n- '
        const pos = ta.selectionStart
        onChange(ta.value.slice(0, pos) + ins + ta.value.slice(pos))
        setTimeout(() => ta.setSelectionRange(pos + ins.length, pos + ins.length), 0)
      }
    }
  }

  const toolbarItems = [
    { label: 'B', title: 'Fett (**text**)', fn: () => applyFormat('bold'), cls: 'font-bold' },
    { label: 'I', title: 'Kursiv (*text*)', fn: () => applyFormat('italic'), cls: 'italic' },
    { label: '<>', title: 'Code (`text`)', fn: () => applyFormat('code'), cls: 'font-mono text-xs' },
    { label: '• Liste', title: 'Bullet-Liste (- item)', fn: () => applyFormat('bullet'), cls: '' },
    { label: '🔗 Link', title: 'Link einfügen', fn: () => applyFormat('link'), cls: '' },
  ]

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1 flex-wrap">
        {toolbarItems.map(btn => (
          <button
            key={btn.label}
            type="button"
            title={btn.title}
            className={`px-2 py-1 text-xs rounded bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition-colors border border-gray-600 ${btn.cls}`}
            onMouseDown={e => { e.preventDefault(); btn.fn() }}
          >
            {btn.label}
          </button>
        ))}
        <div className="flex-1" />
        <button
          type="button"
          className={`px-2 py-1 text-xs rounded border transition-colors ${showPreview ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-700 border-gray-600 text-gray-400 hover:text-white'}`}
          onClick={() => setShowPreview(p => !p)}
        >
          {showPreview ? '✎ Bearbeiten' : '👁 Vorschau'}
        </button>
      </div>

      {showPreview ? (
        <div
          className="min-h-[100px] rounded-lg border border-gray-600 bg-gray-900/50 px-3 py-2 text-sm text-gray-200 leading-relaxed"
          dangerouslySetInnerHTML={{
            __html: renderPreview(value) || '<span class="text-gray-600">Keine Beschreibung vorhanden.</span>'
          }}
        />
      ) : (
        <textarea
          ref={textareaRef}
          className="w-full rounded-lg border border-gray-600 bg-gray-700 text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none placeholder-gray-500 font-mono leading-relaxed"
          rows={5}
          placeholder={"Beschreibung...\n**fett**  *kursiv*  `code`  - Liste  [Text](https://...)"}
          value={value}
          onChange={e => onChange(e.target.value)}
          onBlur={onBlur}
          onKeyDown={handleKeyDown}
        />
      )}
      <p className="text-xs text-gray-600">**fett** · *kursiv* · `code` · - Liste · [Text](URL)</p>
    </div>
  )
}
