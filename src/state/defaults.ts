import type { AppState, PrintSettings, SongMeta } from "../types"

export const STORAGE_KEY = "cifras-offline-state-v1"

export const DEFAULT_SONG_META: SongMeta = {
  title: "",
  artist: "",
  composers: "",
  key: "",
  capo: 0,
  tuning: "E A D G B E",
  customTuning: "",
  tag: "",
}

export const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  pageSize: "A4",
  textColor: "#1e1a16",
  chordColor: "#9b4d1c",
  fontSize: 15,
  lineHeight: 1.45,
  printMarginMm: 12,
  printLayout: "single",
  columnGapMm: 8,
  showMetadata: true,
  showChords: true,
  transpose: 0,
  preferFlats: false,
  capo: 0,
}

export const DEFAULT_STATE: AppState = {
  step: 0,
  songMeta: DEFAULT_SONG_META,
  rawLyrics: "",
  chartText: "",
  printSettings: DEFAULT_PRINT_SETTINGS,
  recentChords: [],
}
