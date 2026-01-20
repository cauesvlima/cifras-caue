export type SongMeta = {
  title: string
  artist: string
  composers: string
  key: string
  capo: number
  tuning: string
  customTuning: string
  tag: string
}

export type PrintSettings = {
  pageSize: "A4"
  textColor: string
  chordColor: string
  fontSize: number
  lineHeight: number
  showMetadata: boolean
  showChords: boolean
  transpose: number
  preferFlats: boolean
  capo: number
}

export type AppState = {
  step: number
  songMeta: SongMeta
  rawLyrics: string
  chartText: string
  printSettings: PrintSettings
  recentChords: string[]
}
