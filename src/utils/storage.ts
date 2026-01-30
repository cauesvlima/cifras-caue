import type { AppState, PrintSettings, SongMeta } from "../types"
import { DEFAULT_PRINT_SETTINGS, DEFAULT_SONG_META, DEFAULT_STATE, STORAGE_KEY } from "../state/defaults"

type LegacyChartLine = {
  id?: string
  chordsLine?: string
  lyricsLine?: string
}

const legacyChartLinesToText = (lines: unknown) => {
  if (!Array.isArray(lines)) return ""
  return lines
    .map((line: LegacyChartLine) => {
      const chords = typeof line?.chordsLine === "string" ? line.chordsLine : ""
      const lyrics = typeof line?.lyricsLine === "string" ? line.lyricsLine : ""
      return `${chords}\n${lyrics}`
    })
    .join("\n")
}

type LegacyState = Partial<AppState> & { chartLines?: unknown }

const STORAGE_META_KEY = `${STORAGE_KEY}-meta`
const STORAGE_LYRICS_KEY = `${STORAGE_KEY}-lyrics`
const STORAGE_CHART_KEY = `${STORAGE_KEY}-chart`

export const normalizeState = (input: LegacyState | null | undefined): AppState => {
  const rawSongMeta = { ...DEFAULT_SONG_META, ...(input?.songMeta ?? {}) }
  const songMeta = {
    ...rawSongMeta,
    capo: typeof rawSongMeta.capo === "number" ? rawSongMeta.capo : Number(rawSongMeta.capo) || 0,
  }

  const rawPrintSettings = { ...DEFAULT_PRINT_SETTINGS, ...(input?.printSettings ?? {}) }
  const printSettings: PrintSettings = {
    ...rawPrintSettings,
    fontSize:
      typeof rawPrintSettings.fontSize === "number"
        ? rawPrintSettings.fontSize
        : Number(rawPrintSettings.fontSize) || DEFAULT_PRINT_SETTINGS.fontSize,
    lineHeight:
      typeof rawPrintSettings.lineHeight === "number"
        ? rawPrintSettings.lineHeight
        : Number(rawPrintSettings.lineHeight) || DEFAULT_PRINT_SETTINGS.lineHeight,
    printMarginMm:
      typeof rawPrintSettings.printMarginMm === "number"
        ? rawPrintSettings.printMarginMm
        : Number(rawPrintSettings.printMarginMm) || DEFAULT_PRINT_SETTINGS.printMarginMm,
    printLayout: rawPrintSettings.printLayout === "double" ? "double" : "single",
    columnGapMm:
      typeof rawPrintSettings.columnGapMm === "number"
        ? rawPrintSettings.columnGapMm
        : Number(rawPrintSettings.columnGapMm) || DEFAULT_PRINT_SETTINGS.columnGapMm,
    transpose:
      typeof rawPrintSettings.transpose === "number"
        ? rawPrintSettings.transpose
        : Number(rawPrintSettings.transpose) || DEFAULT_PRINT_SETTINGS.transpose,
    capo:
      typeof rawPrintSettings.capo === "number"
        ? rawPrintSettings.capo
        : Number(rawPrintSettings.capo) || songMeta.capo || 0,
  }

  const step =
    typeof input?.step === "number" && input.step >= 0 && input.step <= 3
      ? input.step
      : DEFAULT_STATE.step

  const chartText =
    typeof input?.chartText === "string"
      ? input.chartText
      : legacyChartLinesToText(input?.chartLines)

  return {
    step,
    songMeta,
    rawLyrics: typeof input?.rawLyrics === "string" ? input.rawLyrics : DEFAULT_STATE.rawLyrics,
    chartText,
    printSettings,
    recentChords: Array.isArray(input?.recentChords)
      ? input?.recentChords.filter((item) => typeof item === "string")
      : DEFAULT_STATE.recentChords,
  }
}

export const loadState = (): AppState | null => {
  const raw = localStorage.getItem(STORAGE_KEY)
  const rawMeta = localStorage.getItem(STORAGE_META_KEY)
  const rawLyrics = localStorage.getItem(STORAGE_LYRICS_KEY)
  const rawChart = localStorage.getItem(STORAGE_CHART_KEY)

  if (!raw && !rawMeta && rawLyrics === null && rawChart === null) return null

  let base: Partial<AppState> = {}
  if (raw) {
    try {
      base = JSON.parse(raw) as Partial<AppState>
    } catch {
      base = {}
    }
  }

  let meta: Partial<SongMeta> | undefined
  if (rawMeta) {
    try {
      meta = JSON.parse(rawMeta) as Partial<SongMeta>
    } catch {
      meta = undefined
    }
  }

  const merged: Partial<AppState> = {
    ...base,
    songMeta: meta ?? base.songMeta,
    rawLyrics: rawLyrics !== null ? rawLyrics : base.rawLyrics,
    chartText: rawChart !== null ? rawChart : base.chartText,
  }

  return normalizeState(merged)
}

export const saveState = (state: AppState) => {
  const { songMeta, rawLyrics, chartText, ...rest } = state
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rest))
  localStorage.setItem(STORAGE_META_KEY, JSON.stringify(songMeta))
  localStorage.setItem(STORAGE_LYRICS_KEY, rawLyrics)
  localStorage.setItem(STORAGE_CHART_KEY, chartText)
}

export const clearState = () => {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(STORAGE_META_KEY)
  localStorage.removeItem(STORAGE_LYRICS_KEY)
  localStorage.removeItem(STORAGE_CHART_KEY)
}
