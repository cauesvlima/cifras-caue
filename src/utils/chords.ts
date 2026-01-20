const NOTES_SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
const NOTES_FLAT = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"]

const NOTE_INDEX: Record<string, number> = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
}

const CHORD_TOKEN_FULL_REGEX =
  /^[A-G](?:#|b)?(?:(?:maj|min|m|dim|aug|sus|add)?\d*(?:\([^)]*\))?)?(?:\/[A-G](?:#|b)?)?$/

const CHORD_TOKEN_WRAPPED_REGEX =
  /^([^A-Za-z]*)([A-G](?:#|b)?(?:(?:maj|min|m|dim|aug|sus|add)?\d*(?:\([^)]*\))?)?(?:\/[A-G](?:#|b)?)?)([^A-Za-z]*)$/

const ROOT_NOTE_REGEX = /^[A-G](?:#|b)?/

const clampSemitones = (value: number) => {
  if (value > 12) return 12
  if (value < -12) return -12
  return value
}

const transposeNote = (note: string, semitones: number, preferFlats: boolean) => {
  const index = NOTE_INDEX[note]
  if (index === undefined) return note
  const next = (index + semitones + 12) % 12
  return preferFlats ? NOTES_FLAT[next] : NOTES_SHARP[next]
}

const transposeChordCore = (chord: string, semitones: number, preferFlats: boolean) => {
  if (!chord || semitones === 0) return chord
  const parts = chord.split("/")
  const main = parts[0]
  const bass = parts[1]
  const rootMatch = main.match(ROOT_NOTE_REGEX)
  if (!rootMatch) return chord
  const root = rootMatch[0]
  const suffix = main.slice(root.length)
  const newRoot = transposeNote(root, semitones, preferFlats)
  const nextMain = `${newRoot}${suffix}`
  if (!bass) return nextMain
  const bassMatch = bass.match(ROOT_NOTE_REGEX)
  if (!bassMatch) return `${nextMain}/${bass}`
  const bassRoot = bassMatch[0]
  const bassSuffix = bass.slice(bassRoot.length)
  const newBass = transposeNote(bassRoot, semitones, preferFlats)
  return `${nextMain}/${newBass}${bassSuffix}`
}

export const isChordToken = (token: string) => CHORD_TOKEN_FULL_REGEX.test(token.trim())

export const extractChordTokens = (line: string) =>
  line
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0 && isChordToken(token))

export const transposeChordToken = (token: string, semitones: number, preferFlats: boolean) => {
  const match = token.match(CHORD_TOKEN_WRAPPED_REGEX)
  if (!match) return token
  const chord = match[2]
  if (!isChordToken(chord)) return token
  const transposed = transposeChordCore(chord, clampSemitones(semitones), preferFlats)
  return `${match[1]}${transposed}${match[3]}`
}

export const transposeChordLine = (line: string, semitones: number, preferFlats: boolean) => {
  if (!line || semitones === 0) return line
  return line
    .split(/(\s+)/)
    .map((part) => {
      if (part.trim() === "") return part
      return transposeChordToken(part, semitones, preferFlats)
    })
    .join("")
}

export const transposeKeyName = (keyName: string, semitones: number, preferFlats: boolean) => {
  if (!keyName || semitones === 0) return keyName
  return transposeChordCore(keyName, clampSemitones(semitones), preferFlats)
}

export const formatTransposeLabel = (semitones: number) => {
  if (semitones === 0) return "0"
  const abs = Math.abs(semitones)
  const label =
    abs === 1
      ? "1/2 tom"
      : abs % 2 === 0
        ? `${abs / 2} tom`
        : `${Math.floor(abs / 2)} 1/2 tom`
  const prefix = semitones > 0 ? "+" : "-"
  return `${prefix}${label}`
}
