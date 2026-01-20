import { type ChangeEvent, useEffect, useRef, useState } from "react"
import Stepper from "./components/Stepper"
import SongMetaForm from "./components/SongMetaForm"
import RawLyricsInput from "./components/RawLyricsInput"
import ChordChartEditor from "./components/ChordChartEditor"
import PrintPreview from "./components/PrintPreview"
import SidePanelSettings from "./components/SidePanelSettings"
import type { AppState, PrintSettings, SongMeta } from "./types"
import { DEFAULT_PRINT_SETTINGS, DEFAULT_STATE } from "./state/defaults"
import { clearState, loadState, normalizeState, saveState } from "./utils/storage"
import { useDebouncedEffect } from "./hooks/useDebouncedEffect"

const STEPS = ["Cadastro", "Letra", "Editor", "Impressão"]

const buildChartText = (rawLyrics: string) => {
  const rows = rawLyrics.split(/\r?\n/)
  if (rows.length === 0) return ""
  return rows.flatMap((line) => ["", line]).join("\n")
}

const App = () => {
  const [state, setState] = useState<AppState>(() => normalizeState(loadState()))
  const [showMetaErrors, setShowMetaErrors] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useDebouncedEffect(() => {
    saveState(state)
  }, [state], 500)

  useEffect(() => {
    if (state.step === 2 && state.chartText.length === 0) {
      setState((prev) => ({
        ...prev,
        chartText: buildChartText(prev.rawLyrics),
      }))
    }
  }, [state.step, state.chartText, state.rawLyrics])

  const updateSongMeta = (next: SongMeta) => {
    setState((prev) => {
      const shouldSyncCapo = prev.printSettings.capo === prev.songMeta.capo
      return {
        ...prev,
        songMeta: next,
        printSettings: {
          ...prev.printSettings,
          capo: shouldSyncCapo ? next.capo : prev.printSettings.capo,
        },
      }
    })
  }

  const updatePrintSettings = (next: PrintSettings) => {
    setState((prev) => ({ ...prev, printSettings: next }))
  }

  const isMetaValid = state.songMeta.title.trim().length > 0 && state.songMeta.key.trim().length > 0

  const handleMetaNext = () => {
    if (!isMetaValid) {
      setShowMetaErrors(true)
      return
    }
    setShowMetaErrors(false)
    setState((prev) => ({ ...prev, step: 1 }))
  }

  const handleConfirmLyrics = () => {
    const nextText = buildChartText(state.rawLyrics)
    const hasEdits = state.chartText.trim().length > 0
    if (hasEdits) {
      const ok = window.confirm(
        "Isso vai substituir a cifra já editada. Deseja continuar?",
      )
      if (!ok) return
    }
    setState((prev) => ({ ...prev, chartText: nextText, step: 2 }))
  }

  const handleExport = () => {
    const payload = JSON.stringify(state, null, 2)
    const blob = new Blob([payload], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${state.songMeta.title || "cifra"}-backup.json`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const parsed = JSON.parse(text) as Partial<AppState>
      setState(normalizeState(parsed))
      setImportError(null)
    } catch {
      setImportError("Arquivo inválido. Verifique o JSON e tente novamente.")
    } finally {
      event.target.value = ""
    }
  }

  const handleResetAll = () => {
    const ok = window.confirm("Deseja limpar todo o projeto atual?")
    if (!ok) return
    clearState()
    setState(DEFAULT_STATE)
    setShowMetaErrors(false)
    setImportError(null)
  }

  const handleResetSettings = () => {
    setState((prev) => ({
      ...prev,
      printSettings: { ...DEFAULT_PRINT_SETTINGS, capo: prev.songMeta.capo },
    }))
  }

  const currentContent = () => {
    switch (state.step) {
      case 0:
        return (
          <SongMetaForm
            value={state.songMeta}
            onChange={updateSongMeta}
            onNext={handleMetaNext}
            showErrors={showMetaErrors}
          />
        )
      case 1:
        return (
          <RawLyricsInput
            value={state.rawLyrics}
            onChange={(next) => setState((prev) => ({ ...prev, rawLyrics: next }))}
            onBack={() => setState((prev) => ({ ...prev, step: 0 }))}
            onConfirm={handleConfirmLyrics}
          />
        )
      case 2:
        return (
          <ChordChartEditor
            value={state.chartText}
            onChange={(next) => setState((prev) => ({ ...prev, chartText: next }))}
            onBack={() => setState((prev) => ({ ...prev, step: 1 }))}
            onPreview={() => setState((prev) => ({ ...prev, step: 3 }))}
          />
        )
      case 3:
        return (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setState((prev) => ({ ...prev, step: 2 }))}
                className="no-print rounded-full border border-black/10 px-4 py-2 text-xs font-semibold text-black/60 hover:bg-black/5"
              >
                Voltar ao editor
              </button>
              <div className="overflow-auto">
                <PrintPreview
                  songMeta={state.songMeta}
                  chartText={state.chartText}
                  settings={state.printSettings}
                />
              </div>
            </div>
            <div className="no-print">
              <SidePanelSettings
                settings={state.printSettings}
                onChange={updatePrintSettings}
                onReset={handleResetSettings}
                onPrint={() => window.print()}
              />
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen px-4 pb-16 pt-10 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="no-print flex flex-col gap-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#7a6149]">
                Cifras offline
              </p>
              <h1 className="text-3xl font-semibold">Criador de cifras pessoais</h1>
              <p className="max-w-2xl text-sm text-black/60">
                Fluxo simples em 4 etapas para cadastrar a música, colar a letra, inserir
                acordes e imprimir em A4. Tudo salvo automaticamente no cache local.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleExport}
                className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold text-black/60 hover:bg-black/5"
              >
                Exportar JSON
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold text-black/60 hover:bg-black/5"
              >
                Importar JSON
              </button>
              <button
                type="button"
                onClick={handleResetAll}
                className="rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-500 hover:bg-red-50"
              >
                Resetar
              </button>
            </div>
          </div>
          <Stepper
            steps={STEPS}
            currentStep={state.step}
            onStepChange={(index) => setState((prev) => ({ ...prev, step: index }))}
          />
          <div className="flex flex-wrap items-center gap-3 text-xs text-black/50">
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Autosave ativo
            </span>
            {importError && <span className="text-red-500">{importError}</span>}
          </div>
        </header>

        <main>{currentContent()}</main>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        onChange={handleImport}
        className="hidden"
      />
    </div>
  )
}

export default App
