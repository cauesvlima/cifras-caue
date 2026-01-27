import { useEffect, useMemo, useRef, useState } from "react"

type ChordChartEditorProps = {
  value: string
  onChange: (next: string) => void
  onBack: () => void
  onPreview: () => void
}

const MARKERS = ["[Intro]", "[Verso]", "[Pre]", "[Refrao]", "[Ponte]" , "[Solo]"]
const MAX_HISTORY = 120

const countLines = (text: string) => text.split(/\r?\n/).length

const ChordChartEditor = ({ value, onChange, onBack, onPreview }: ChordChartEditorProps) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const undoStackRef = useRef<string[]>([])
  const redoStackRef = useRef<string[]>([])
  const lastValueRef = useRef(value)
  const skipHistoryRef = useRef(false)
  const [historyState, setHistoryState] = useState({ undo: 0, redo: 0 })

  const lineCount = useMemo(() => countLines(value), [value])

  useEffect(() => {
    if (skipHistoryRef.current) {
      skipHistoryRef.current = false
      lastValueRef.current = value
      setHistoryState({
        undo: undoStackRef.current.length,
        redo: redoStackRef.current.length,
      })
      return
    }

    if (value !== lastValueRef.current) {
      undoStackRef.current.push(lastValueRef.current)
      if (undoStackRef.current.length > MAX_HISTORY) {
        undoStackRef.current.shift()
      }
      redoStackRef.current = []
      lastValueRef.current = value
      setHistoryState({
        undo: undoStackRef.current.length,
        redo: redoStackRef.current.length,
      })
    }
  }, [value])

  const focusAndSetCursor = (position: number) => {
    requestAnimationFrame(() => {
      const textarea = textareaRef.current
      if (!textarea) return
      textarea.focus()
      textarea.setSelectionRange(position, position)
    })
  }

  const insertAtCursor = (snippet: string) => {
    const textarea = textareaRef.current
    const start = textarea?.selectionStart ?? value.length
    const end = textarea?.selectionEnd ?? value.length
    const nextValue = value.slice(0, start) + snippet + value.slice(end)
    onChange(nextValue)
    focusAndSetCursor(start + snippet.length)
  }

  const handleUndo = () => {
    const previous = undoStackRef.current.pop()
    if (previous === undefined) return
    redoStackRef.current.push(value)
    skipHistoryRef.current = true
    onChange(previous)
    focusAndSetCursor(previous.length)
    setHistoryState({
      undo: undoStackRef.current.length,
      redo: redoStackRef.current.length,
    })
  }

  const handleRedo = () => {
    const next = redoStackRef.current.pop()
    if (next === undefined) return
    undoStackRef.current.push(value)
    skipHistoryRef.current = true
    onChange(next)
    focusAndSetCursor(next.length)
    setHistoryState({
      undo: undoStackRef.current.length,
      redo: redoStackRef.current.length,
    })
  }

  return (
    <div className="card-surface space-y-6 p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-[#8a6b4f]">Etapa 3</p>
          <h2 className="mt-2 text-2xl font-semibold">Editor de cifra</h2>
          <p className="mt-2 text-sm text-black/60">
            Edite como um documento: tudo em monoespacado, sem reformatacao automatica.
          </p>
        </div>
        <div className="rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-xs text-black/60">
          Linhas: <span className="font-semibold text-black/80">{lineCount}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {MARKERS.map((marker) => (
          <button
            key={marker}
            type="button"
            className="rounded-full border border-black/10 bg-white/80 px-3 py-1 text-xs font-semibold text-black/70 hover:bg-black/5"
            onClick={() => insertAtCursor(marker)}
          >
            {marker}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={handleUndo}
            disabled={historyState.undo === 0}
            className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold text-black/70 disabled:opacity-40"
          >
            Desfazer
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={historyState.redo === 0}
            className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold text-black/70 disabled:opacity-40"
          >
            Refazer
          </button>
        </div>
      </div>

      <textarea
        ref={textareaRef}
        className="mono-editor h-[520px] w-full rounded-2xl border border-black/10 bg-white/85 p-4 text-sm leading-6 shadow-sm whitespace-pre"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Digite a cifra aqui..."
        wrap="off"
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-black/10 px-6 py-3 text-sm font-semibold text-black/70 transition hover:bg-black/5"
        >
          Voltar
        </button>
        <button
          type="button"
          onClick={onPreview}
          className="rounded-full bg-[#1f1a17] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#3a2c26]"
        >
          Pre-visualizar impressao
        </button>
      </div>
    </div>
  )
}

export default ChordChartEditor
