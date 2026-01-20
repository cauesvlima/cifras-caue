import type { AppState } from "../types"
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

export const normalizeState = (input: LegacyState | null | undefined): AppState => {
  const rawSongMeta = { ...DEFAULT_SONG_META, ...(input?.songMeta ?? {}) }
  const songMeta = {
    ...rawSongMeta,
    capo: typeof rawSongMeta.capo === "number" ? rawSongMeta.capo : Number(rawSongMeta.capo) || 0,
  }

  const rawPrintSettings = { ...DEFAULT_PRINT_SETTINGS, ...(input?.printSettings ?? {}) }
  const printSettings = {
    ...rawPrintSettings,
    fontSize:
      typeof rawPrintSettings.fontSize === "number"
        ? rawPrintSettings.fontSize
        : Number(rawPrintSettings.fontSize) || DEFAULT_PRINT_SETTINGS.fontSize,
    lineHeight:
      typeof rawPrintSettings.lineHeight === "number"
        ? rawPrintSettings.lineHeight
        : Number(rawPrintSettings.lineHeight) || DEFAULT_PRINT_SETTINGS.lineHeight,
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
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<AppState>
    return normalizeState(parsed)
  } catch {
    return null
  }
}

export const saveState = (state: AppState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export const clearState = () => {
  localStorage.removeItem(STORAGE_KEY)
}
