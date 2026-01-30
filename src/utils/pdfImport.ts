import { GlobalWorkerOptions, getDocument } from "pdfjs-dist"
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url"
import type { SongMeta } from "../types"
import { isChordToken } from "./chords"

GlobalWorkerOptions.workerSrc = workerSrc

type PdfToken = {
  page: number
  text: string
  x: number
  yTop: number
  fontSize: number
  width: number
  charWidth: number
}

type PdfLine = {
  id: string
  page: number
  index: number
  yTop: number
  text: string
  tokens: PdfToken[]
}

export type PdfImportResult = {
  chartText: string
  songMeta: Partial<SongMeta>
  pageCount: number
}

const median = (values: number[]) => {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

const normalizeTokenText = (value: string) => {
  const cleaned = value.replace(/[\r\n\t]/g, " ")
  return cleaned.replace(/^\s+/, "")
}

const isNoiseLine = (value: string) => {
  const normalized = value.toLowerCase()
  return (
    normalized.includes("cifra club") ||
    normalized.includes("cifraclub") ||
    normalized.includes("www.cifraclub")
  )
}

const cleanChordToken = (token: string) => token.replace(/[()[\]{}.,;:]+/g, "")

const normalizeChordToken = (token: string) => {
  const cleaned = cleanChordToken(token)
  if (!cleaned) return cleaned
  return `${cleaned[0].toUpperCase()}${cleaned.slice(1)}`
}

const isChordLikeToken = (token: string) => isChordToken(normalizeChordToken(token))

const getChordRatio = (line: string) => {
  const tokens = line.trim().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return 0
  const meaningful = tokens.filter((token) => /[A-Za-z0-9]/.test(token))
  const base = meaningful.length > 0 ? meaningful : tokens
  if (base.length === 0) return 0
  const chordCount = base.filter((token) => isChordLikeToken(token)).length
  return chordCount / base.length
}

const isTagLine = (line: string) => /^\s*\[[^\]]+\]/.test(line.trim())

const buildLineText = (tokens: PdfToken[], minX: number, charWidth: number) => {
  const sorted = [...tokens].sort((a, b) => a.x - b.x)
  let text = ""
  sorted.forEach((token) => {
    const tokenText = normalizeTokenText(token.text)
    if (!tokenText) return
    const targetIndex = Math.max(0, Math.round((token.x - minX) / charWidth))
    if (text.length < targetIndex) {
      text += " ".repeat(targetIndex - text.length)
    }
    text += tokenText
  })
  return text.replace(/[ \t]+$/g, "")
}

const groupTokensByLine = (tokens: PdfToken[]) => {
  if (!tokens.length) return []
  const fontSizes = tokens.map((token) => token.fontSize).filter((size) => size > 0)
  const medianFontSize = median(fontSizes)
  const tolerance = Math.max(1.5, Math.min(6, medianFontSize * 0.25 || 2))

  const sorted = [...tokens].sort((a, b) => {
    if (a.yTop !== b.yTop) return a.yTop - b.yTop
    return a.x - b.x
  })
  const lines: { yTop: number; tokens: PdfToken[] }[] = []

  sorted.forEach((token) => {
    const last = lines[lines.length - 1]
    if (!last || Math.abs(token.yTop - last.yTop) > tolerance) {
      lines.push({ yTop: token.yTop, tokens: [token] })
      return
    }
    last.tokens.push(token)
    last.yTop = (last.yTop * (last.tokens.length - 1) + token.yTop) / last.tokens.length
  })

  return lines
}

const insertBlankLines = (lines: PdfLine[]) => {
  if (lines.length < 2) return lines
  const gaps: number[] = []
  for (let i = 1; i < lines.length; i += 1) {
    gaps.push(lines[i].yTop - lines[i - 1].yTop)
  }
  const medianGap = median(gaps) || 0
  if (medianGap <= 0) return lines

  const output: PdfLine[] = []
  lines.forEach((line, index) => {
    output.push(line)
    const next = lines[index + 1]
    if (!next) return
    const gap = next.yTop - line.yTop
    if (gap <= medianGap * 1.6) return
    const extraLines = Math.min(3, Math.max(1, Math.round(gap / medianGap) - 1))
    for (let blankIndex = 0; blankIndex < extraLines; blankIndex += 1) {
      output.push({
        id: `${line.page}-blank-${line.index}-${blankIndex}`,
        page: line.page,
        index: line.index + blankIndex + 0.1,
        yTop: line.yTop + (gap / (extraLines + 1)) * (blankIndex + 1),
        text: "",
        tokens: [],
      })
    }
  })
  return output
}

const parseMetadata = (lines: PdfLine[]) => {
  const meta: Partial<SongMeta> = {}
  const exclude = new Set<string>()
  const candidates = lines.filter((line) => line.text.trim().length > 0).slice(0, 12)

  candidates.forEach((line) => {
    const raw = line.text.trim()
    const normalized = raw.replace(/\s+/g, " ")
    if (isNoiseLine(normalized)) {
      exclude.add(line.id)
      return
    }
    const composerMatch = normalized.match(/composi[cç][aã]o\s*(?:de)?\s*:\s*(.+)/i)
    if (composerMatch && !meta.composers) {
      meta.composers = composerMatch[1].trim()
      exclude.add(line.id)
      return
    }
    const keyMatch = normalized.match(/tom\s*:\s*(.+)/i)
    if (keyMatch && !meta.key) {
      const keyCandidate = keyMatch[1].trim()
      meta.key = extractFirstChord(keyCandidate) || keyCandidate
      exclude.add(line.id)
      return
    }
    const tuningMatch = normalized.match(/afin[aã]c[aã]o\s*:\s*(.+)/i)
    if (tuningMatch && !meta.tuning) {
      const tuningCandidate = tuningMatch[1].trim()
      meta.tuning = normalizeTuning(tuningCandidate)
      exclude.add(line.id)
    }
  })

  let title: string | undefined
  let artist: string | undefined

  for (const line of candidates) {
    if (exclude.has(line.id)) continue
    const raw = line.text.trim()
    if (!raw) continue
    const normalized = raw.replace(/\s+/g, " ")
    if (isNoiseLine(normalized)) {
      exclude.add(line.id)
      continue
    }
    if (normalized.match(/^(tom|afin[aã]c[aã]o|composi[cç][aã]o)\b/i)) continue
    if (getChordRatio(normalized) >= 0.6) continue
    if (!title) {
      title = normalized
      exclude.add(line.id)
      continue
    }
    if (!artist) {
      artist = normalized
      exclude.add(line.id)
      break
    }
  }

  if (title) meta.title = title
  if (artist) meta.artist = artist
  return { meta, exclude }
}

const extractFirstChord = (value: string) => {
  const tokens = value.split(/\s+/).filter(Boolean)
  for (const token of tokens) {
    const normalized = normalizeChordToken(token)
    if (isChordToken(normalized)) return normalized
  }
  return ""
}

const normalizeTuning = (value: string) => {
  const tokens =
    value.match(/[A-Ga-g](?:#|b)?/g)?.map((token) => {
      if (!token) return token
      return `${token[0].toUpperCase()}${token.slice(1)}`
    }) ?? []
  return tokens.length ? tokens.join(" ") : value
}

const buildPairs = (lines: PdfLine[]) => {
  const pairs: { chord: string; lyric: string }[] = []
  let pendingChord: string | null = null

  const flushPending = () => {
    if (pendingChord === null) return
    pairs.push({ chord: pendingChord, lyric: "" })
    pendingChord = null
  }

  lines.forEach((line) => {
    const text = line.text.replace(/[ \t]+$/g, "")
    const trimmed = text.trim()
    if (trimmed.length === 0) {
      flushPending()
      pairs.push({ chord: "", lyric: "" })
      return
    }

    if (isTagLine(text)) {
      flushPending()
      pairs.push({ chord: text, lyric: "" })
      return
    }

    const chordRatio = getChordRatio(text)
    const isChordLine = chordRatio >= 0.6

    if (isChordLine) {
      if (pendingChord !== null) {
        pairs.push({ chord: pendingChord, lyric: "" })
      }
      pendingChord = text
      return
    }

    if (pendingChord !== null) {
      pairs.push({ chord: pendingChord, lyric: text })
      pendingChord = null
      return
    }

    pairs.push({ chord: "", lyric: text })
  })

  flushPending()
  return pairs
}

const trimEmptyPairs = (pairs: { chord: string; lyric: string }[]) => {
  let start = 0
  while (start < pairs.length) {
    const pair = pairs[start]
    if (pair.chord.trim().length > 0 || pair.lyric.trim().length > 0) break
    start += 1
  }
  let end = pairs.length - 1
  while (end >= start) {
    const pair = pairs[end]
    if (pair.chord.trim().length > 0 || pair.lyric.trim().length > 0) break
    end -= 1
  }
  return pairs.slice(start, end + 1)
}

const linesToChartText = (pairs: { chord: string; lyric: string }[]) => {
  if (!pairs.length) return ""
  const compact = trimEmptyPairs(pairs)
  return compact.flatMap((pair) => [pair.chord, pair.lyric]).join("\n")
}

export const importPdfFile = async (file: File): Promise<PdfImportResult> => {
  const data = await file.arrayBuffer()
  const loadingTask = getDocument({ data })
  const pdf = await loadingTask.promise
  const pageCount = pdf.numPages

  const allLines: PdfLine[] = []
  let firstPageLines: PdfLine[] = []

  for (let pageIndex = 1; pageIndex <= pageCount; pageIndex += 1) {
    const page = await pdf.getPage(pageIndex)
    const viewport = page.getViewport({ scale: 1 })
    const textContent = await page.getTextContent()
    const tokens: PdfToken[] = []

    textContent.items.forEach((item) => {
      if (!("str" in item)) return
      const text = String(item.str ?? "")
      if (!text.trim()) return
      const transform = item.transform ?? [0, 0, 0, 0, 0, 0]
      const x = Number(transform[4] ?? 0)
      const y = Number(transform[5] ?? 0)
      const yTop = viewport.height - y
      const fontSize = Math.max(Math.abs(transform[0] ?? 0), Math.abs(transform[3] ?? 0))
      const width = Number(item.width ?? 0)
      const charWidth = text.length > 0 ? width / text.length : 0

      tokens.push({
        page: pageIndex,
        text,
        x,
        yTop,
        fontSize,
        width,
        charWidth,
      })
    })

    if (!tokens.length) continue

    const fontSizes = tokens.map((token) => token.fontSize).filter((size) => size > 0)
    const medianFontSize = median(fontSizes)
    const bodyTokens = tokens.filter(
      (token) => !medianFontSize || Math.abs(token.fontSize - medianFontSize) <= medianFontSize * 0.35,
    )
    const minXSource = bodyTokens.length ? bodyTokens : tokens
    const minX = Math.min(...minXSource.map((token) => token.x))
    const charWidthCandidates = bodyTokens
      .filter((token) => token.charWidth > 0 && token.text.trim().length > 1)
      .map((token) => token.charWidth)
    const charWidth = median(charWidthCandidates) || medianFontSize * 0.55 || 6

    const grouped = groupTokensByLine(tokens)
    const pageLines: PdfLine[] = grouped.map((line, index) => ({
      id: `${pageIndex}-${index}`,
      page: pageIndex,
      index,
      yTop: line.yTop,
      text: buildLineText(line.tokens, minX, charWidth),
      tokens: line.tokens,
    }))

    pageLines.sort((a, b) => a.yTop - b.yTop)
    const withBlanks = insertBlankLines(pageLines)

    if (pageIndex === 1) {
      firstPageLines = pageLines
    }

    allLines.push(...withBlanks)
    if (pageIndex !== pageCount) {
      allLines.push({
        id: `${pageIndex}-page-break`,
        page: pageIndex,
        index: pageLines.length + 1,
        yTop: viewport.height + 100,
        text: "",
        tokens: [],
      })
    }
  }

  const { meta, exclude } = parseMetadata(firstPageLines)
  const filteredLines = allLines.filter((line) => {
    if (exclude.has(line.id)) return false
    if (isNoiseLine(line.text)) return false
    return true
  })

  const pairs = buildPairs(filteredLines)
  const chartText = linesToChartText(pairs)

  return {
    chartText,
    songMeta: meta,
    pageCount,
  }
}
