import type { PrintSettings } from "../types"
import { formatTransposeLabel } from "../utils/chords"

const TEXT_COLORS = [
  { label: "Preto", value: "#1e1a16" },
  { label: "Grafite", value: "#2d2a27" },
  { label: "Marrom", value: "#4b2f23" },
  { label: "Azul escuro", value: "#263348" },
]

const CHORD_COLORS = [
  { label: "Preto", value: "#1e1a16" },
  { label: "Canela", value: "#9b4d1c" },
  { label: "Oliva", value: "#6b6b35" },
  { label: "Azul médio", value: "#2f5a8a" },
]

const MARGIN_PRESETS = [
  { label: "Padrão", value: 12 },
  { label: "Compacto", value: 6 },
  { label: "Mínimo", value: 3 },
]

const LAYOUT_OPTIONS = [
  { label: "1 coluna", value: "single" as const },
  { label: "2 colunas", value: "double" as const },
]

type SidePanelSettingsProps = {
  settings: PrintSettings
  onChange: (next: PrintSettings) => void
  onReset: () => void
  onPrint: () => void
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const SidePanelSettings = ({ settings, onChange, onReset, onPrint }: SidePanelSettingsProps) => {
  const isTwoColumns = settings.printLayout === "double"
  const update = <K extends keyof PrintSettings>(field: K, value: PrintSettings[K]) => {
    onChange({ ...settings, [field]: value })
  }

  return (
    <aside
      id="side-panel"
      className="card-surface lg:sticky top-6 flex flex-col gap-6 p-6 text-sm"
    >
      <div>
        <h3 className="text-lg font-semibold">Configurações</h3>
        <p className="mt-1 text-xs text-black/50">Ajuste o layout antes de imprimir.</p>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/40">
          Página
        </p>
        <div className="flex items-center justify-between rounded-xl border border-black/10 bg-white/70 px-4 py-2">
          <span>A4</span>
          <span className="text-xs text-black/50">Fixo</span>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/40">
          Margens
        </p>
        <div className="flex flex-wrap gap-2">
          {MARGIN_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => update("printMarginMm", preset.value)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                settings.printMarginMm === preset.value
                  ? "border-black/40 bg-black/5"
                  : "border-black/10 bg-white"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          <span className="text-xs font-semibold text-black/60">Ajuste manual (mm)</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={3}
              max={20}
              step={1}
              value={settings.printMarginMm}
              onChange={(event) => {
                const value = event.target.valueAsNumber
                if (Number.isNaN(value)) return
                update("printMarginMm", clamp(value, 3, 20))
              }}
              className="w-20 rounded-xl border border-black/10 bg-white/70 px-3 py-2 text-xs"
            />
            <span className="text-xs text-black/50">mm</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/40">
          Layout de impressão
        </p>
        <div className="flex flex-wrap gap-2">
          {LAYOUT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => update("printLayout", option.value)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                settings.printLayout === option.value
                  ? "border-black/40 bg-black/5"
                  : "border-black/10 bg-white"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          <span className="text-xs font-semibold text-black/60">Espaço entre colunas (mm)</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={4}
              max={20}
              step={1}
              value={settings.columnGapMm}
              disabled={!isTwoColumns}
              onChange={(event) => {
                const value = event.target.valueAsNumber
                if (Number.isNaN(value)) return
                update("columnGapMm", clamp(value, 4, 20))
              }}
              className="w-20 rounded-xl border border-black/10 bg-white/70 px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
            />
            <span className="text-xs text-black/50">mm</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/40">
          Cores
        </p>
        <div className="space-y-2">
          <span className="text-xs font-semibold text-black/60">Letras e título</span>
          <div className="flex flex-wrap gap-2">
            {TEXT_COLORS.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => update("textColor", color.value)}
                className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
                  settings.textColor === color.value
                    ? "border-black/40 bg-black/5"
                    : "border-black/10 bg-white"
                }`}
              >
                <span
                  className="h-3 w-3 rounded-full border border-black/10"
                  style={{ backgroundColor: color.value }}
                />
                {color.label}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <span className="text-xs font-semibold text-black/60">Acordes e artista</span>
          <div className="flex flex-wrap gap-2">
            {CHORD_COLORS.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => update("chordColor", color.value)}
                className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
                  settings.chordColor === color.value
                    ? "border-black/40 bg-black/5"
                    : "border-black/10 bg-white"
                }`}
              >
                <span
                  className="h-3 w-3 rounded-full border border-black/10"
                  style={{ backgroundColor: color.value }}
                />
                {color.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/40">
          Tipografia
        </p>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold text-black/60">Tamanho da fonte</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold"
              onClick={() => update("fontSize", clamp(settings.fontSize - 1, 11, 22))}
            >
              A-
            </button>
            <span className="text-xs text-black/50">{settings.fontSize}px</span>
            <button
              type="button"
              className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold"
              onClick={() => update("fontSize", clamp(settings.fontSize + 1, 11, 22))}
            >
              A+
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <span className="text-xs font-semibold text-black/60">Espaçamento de linha</span>
          <input
            type="range"
            min={1.1}
            max={2}
            step={0.05}
            value={settings.lineHeight}
            onChange={(event) => update("lineHeight", Number(event.target.value))}
            className="w-full"
          />
          <div className="text-xs text-black/50">{settings.lineHeight.toFixed(2)}</div>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/40">
          Exibição
        </p>
        <label className="flex items-center justify-between gap-2 text-xs font-semibold text-black/60">
          Exibir metadados
          <input
            type="checkbox"
            checked={settings.showMetadata}
            onChange={(event) => update("showMetadata", event.target.checked)}
          />
        </label>
        <label className="flex items-center justify-between gap-2 text-xs font-semibold text-black/60">
          Exibir acordes
          <input
            type="checkbox"
            checked={settings.showChords}
            onChange={(event) => update("showChords", event.target.checked)}
          />
        </label>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/40">
          Transposição
        </p>
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold"
            onClick={() => update("transpose", clamp(settings.transpose - 1, -12, 12))}
          >
            -
          </button>
          <span className="text-xs font-semibold text-black/70">
            {formatTransposeLabel(settings.transpose)}
          </span>
          <button
            type="button"
            className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold"
            onClick={() => update("transpose", clamp(settings.transpose + 1, -12, 12))}
          >
            +
          </button>
        </div>
        <label className="flex items-center justify-between gap-2 text-xs font-semibold text-black/60">
          Preferir bemóis
          <input
            type="checkbox"
            checked={settings.preferFlats}
            onChange={(event) => update("preferFlats", event.target.checked)}
          />
        </label>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/40">
          Capotraste
        </p>
        <select
          className="rounded-xl border border-black/10 bg-white/70 px-3 py-2 text-sm"
          value={settings.capo}
          onChange={(event) => update("capo", Number(event.target.value))}
        >
          <option value={0}>Não</option>
          {Array.from({ length: 12 }, (_, index) => index + 1).map((capo) => (
            <option key={capo} value={capo}>
              Traste {capo}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={onPrint}
          className="rounded-full bg-[#1f1a17] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#3a2c26]"
        >
          Imprimir
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded-full border border-black/10 px-4 py-3 text-xs font-semibold text-black/60 hover:bg-black/5"
        >
          Resetar configurações
        </button>
      </div>
    </aside>
  )
}

export default SidePanelSettings
