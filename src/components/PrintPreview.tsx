import { type CSSProperties, useLayoutEffect, useMemo, useRef, useState } from "react"
import type { PrintSettings, SongMeta } from "../types"
import { formatTransposeLabel, transposeChordLine, transposeKeyName } from "../utils/chords"

type PrintPreviewProps = {
  songMeta: SongMeta
  chartText: string
  settings: PrintSettings
}

type RenderedLine = {
  key: string
  text: string
  color: string
  weight: number
}

type LinePair = {
  chord: string
  lyric: string
}

type ChartPair = {
  index: number
  chord: string
  lyric: string
  isSeparator: boolean
}

type RenderedBlock = {
  key: string
  lines: RenderedLine[]
  keepTogether: boolean
}

const MIN_MARGIN_MM = 3
const MAX_MARGIN_MM = 20
const MIN_COLUMN_GAP_MM = 4
const MAX_COLUMN_GAP_MM = 20

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const countLeadingSpaces = (value: string) => {
  let count = 0
  while (count < value.length && value[count] === " ") {
    count += 1
  }
  return count
}

const findBreakIndex = (line: string, maxChars: number) => {
  if (line.length <= maxChars) return -1
  const index = line.lastIndexOf(" ", maxChars - 1)
  return index > 0 ? index : -1
}

const wrapLine = (line: string, maxChars: number) => {
  if (maxChars <= 0 || line.length <= maxChars) return [line]
  const segments: string[] = []
  let remaining = line
  while (remaining.length > maxChars) {
    const breakIndex = findBreakIndex(remaining, maxChars)
    if (breakIndex > 0) {
      const head = remaining.slice(0, breakIndex)
      let tail = remaining.slice(breakIndex)
      const trimCount = countLeadingSpaces(tail)
      if (trimCount > 0) {
        tail = tail.slice(trimCount)
      }
      segments.push(head)
      remaining = tail
    } else {
      segments.push(remaining.slice(0, maxChars))
      remaining = remaining.slice(maxChars)
    }
  }
  segments.push(remaining)
  return segments
}

const wrapPair = (chordLine: string, lyricLine: string, maxChars: number) => {
  if (maxChars <= 0 || (chordLine.length <= maxChars && lyricLine.length <= maxChars)) {
    return [{ chord: chordLine, lyric: lyricLine }]
  }
  const pairs: LinePair[] = []
  let chord = chordLine
  let lyric = lyricLine

  while (chord.length > maxChars || lyric.length > maxChars) {
    const guideLine = lyric.length > maxChars ? lyric : chord
    const breakIndex = findBreakIndex(guideLine, maxChars)
    if (breakIndex > 0) {
      const chordHead = chord.slice(0, breakIndex)
      const lyricHead = lyric.slice(0, breakIndex)
      let chordTail = chord.slice(breakIndex)
      let lyricTail = lyric.slice(breakIndex)
      const trimCount = Math.min(countLeadingSpaces(chordTail), countLeadingSpaces(lyricTail))
      if (trimCount > 0) {
        chordTail = chordTail.slice(trimCount)
        lyricTail = lyricTail.slice(trimCount)
      }
      pairs.push({ chord: chordHead, lyric: lyricHead })
      chord = chordTail
      lyric = lyricTail
    } else {
      pairs.push({
        chord: chord.slice(0, maxChars),
        lyric: lyric.slice(0, maxChars),
      })
      chord = chord.slice(maxChars)
      lyric = lyric.slice(maxChars)
    }
  }

  pairs.push({ chord, lyric })
  return pairs
}

const PrintPreview = ({ songMeta, chartText, settings }: PrintPreviewProps) => {
  const tuningLabel =
    songMeta.tuning === "custom" ? songMeta.customTuning || "Custom" : songMeta.tuning
  const transposedKey = transposeKeyName(songMeta.key, settings.transpose, settings.preferFlats)
  const lines = useMemo(() => chartText.split(/\r?\n/), [chartText])
  const contentRef = useRef<HTMLDivElement | null>(null)
  const measureRef = useRef<HTMLSpanElement | null>(null)
  const [charWidth, setCharWidth] = useState(0)
  const [contentWidth, setContentWidth] = useState(0)
  const [columnGapPx, setColumnGapPx] = useState(0)
  const marginMm = clamp(settings.printMarginMm, MIN_MARGIN_MM, MAX_MARGIN_MM)
  const columnGapMm = clamp(settings.columnGapMm, MIN_COLUMN_GAP_MM, MAX_COLUMN_GAP_MM)
  const isTwoColumns = settings.printLayout === "double"

  useLayoutEffect(() => {
    if (!measureRef.current) return
    const rect = measureRef.current.getBoundingClientRect()
    if (rect.width) {
      setCharWidth(rect.width)
    }
  }, [settings.fontSize])

  useLayoutEffect(() => {
    if (!contentRef.current) return
    const element = contentRef.current
    const updateMetrics = () => {
      const rect = element.getBoundingClientRect()
      setContentWidth(rect.width)
      const computed = window.getComputedStyle(element)
      const gapValue = Number.parseFloat(computed.columnGap || "0")
      setColumnGapPx(Number.isFinite(gapValue) ? gapValue : 0)
    }
    updateMetrics()
    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(updateMetrics)
    observer.observe(element)
    return () => observer.disconnect()
  }, [columnGapMm, isTwoColumns, marginMm])

  const charsPerLine = useMemo(() => {
    if (!isTwoColumns || charWidth <= 0 || contentWidth <= 0) return 0
    const columnWidth = (contentWidth - columnGapPx) / 2
    if (columnWidth <= 0) return 0
    return Math.max(10, Math.floor(columnWidth / charWidth))
  }, [isTwoColumns, charWidth, contentWidth, columnGapPx])

  const chartPairs = useMemo(() => {
    const output: ChartPair[] = []
    for (let index = 0; index < lines.length; index += 2) {
      const chord = lines[index] ?? ""
      const lyric = lines[index + 1] ?? ""
      const isSeparator = chord.trim().length === 0 && lyric.trim().length === 0
      output.push({ index, chord, lyric, isSeparator })
    }
    return output
  }, [lines])

  const blocks = useMemo(() => {
    const output: { key: string; pairs: ChartPair[]; keepTogether: boolean }[] = []
    let current: ChartPair[] = []
    let spacer: ChartPair[] = []

    const flushStanza = () => {
      if (!current.length) return
      output.push({
        key: `stanza-${current[0].index}`,
        pairs: current,
        keepTogether: true,
      })
      current = []
    }

    const flushSpacer = () => {
      if (!spacer.length) return
      output.push({
        key: `spacer-${spacer[0].index}`,
        pairs: spacer,
        keepTogether: false,
      })
      spacer = []
    }

    chartPairs.forEach((pair) => {
      if (pair.isSeparator) {
        if (current.length) {
          flushStanza()
        }
        spacer.push(pair)
        return
      }

      if (spacer.length) flushSpacer()
      current.push(pair)
    })

    flushStanza()
    flushSpacer()

    return output
  }, [chartPairs])

  const renderedBlocks = useMemo(() => {
    const output: RenderedBlock[] = []
    const shouldWrap = isTwoColumns && charsPerLine > 0

    blocks.forEach((block) => {
      const linesOutput: RenderedLine[] = []

      block.pairs.forEach((pair) => {
        if (!settings.showChords) {
          const lyricSegments = shouldWrap ? wrapLine(pair.lyric, charsPerLine) : [pair.lyric]
          lyricSegments.forEach((segment, segmentIndex) => {
            linesOutput.push({
              key: `${pair.index}-l-${segmentIndex}`,
              text: segment,
              color: settings.textColor,
              weight: 400,
            })
          })
          return
        }

        const transposedChordLine = transposeChordLine(
          pair.chord,
          settings.transpose,
          settings.preferFlats,
        )
        const pairs = shouldWrap
          ? wrapPair(transposedChordLine, pair.lyric, charsPerLine)
          : [{ chord: transposedChordLine, lyric: pair.lyric }]

        pairs.forEach((wrappedPair, pairIndex) => {
          linesOutput.push({
            key: `${pair.index}-c-${pairIndex}`,
            text: wrappedPair.chord,
            color: settings.chordColor,
            weight: 700,
          })
          linesOutput.push({
            key: `${pair.index}-l-${pairIndex}`,
            text: wrappedPair.lyric,
            color: settings.textColor,
            weight: 400,
          })
        })
      })

      output.push({
        key: block.key,
        lines: linesOutput,
        keepTogether: block.keepTogether,
      })
    })

    return output
  }, [
    blocks,
    settings.showChords,
    settings.transpose,
    settings.preferFlats,
    settings.chordColor,
    settings.textColor,
    isTwoColumns,
    charsPerLine,
  ])

  const baseTextStyle = useMemo(
    () => ({
      fontSize: `${settings.fontSize}px`,
      lineHeight: settings.lineHeight,
    }),
    [settings.fontSize, settings.lineHeight],
  )

  const columnsStyle = useMemo(
    () => ({
      columnCount: isTwoColumns ? 2 : 1,
      columnGap: `${columnGapMm}mm`,
      columnFill: "auto" as const,
    }),
    [columnGapMm, isTwoColumns],
  )

  const pageStyle = useMemo(
    () => ({ "--print-margin": `${marginMm}mm` }) as CSSProperties,
    [marginMm],
  )
  const keepTogetherStyle = useMemo(
    () =>
      ({
        breakInside: "avoid",
        pageBreakInside: "avoid",
        WebkitColumnBreakInside: "avoid",
      }) as CSSProperties,
    [],
  )

  return (
    <div className="a4-page mx-auto" style={pageStyle}>
      <style>{`@media print { @page { size: A4; margin: ${marginMm}mm; } }`}</style>
      <header className="flex flex-col gap-3 border-b border-black/10 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1
              className="text-3xl font-semibold"
              style={{ color: settings.textColor }}
            >
              {songMeta.title || "Sem título"}
            </h1>
            {songMeta.artist && (
              <p className="text-sm font-semibold" style={{ color: settings.chordColor }}>
                {songMeta.artist}
              </p>
            )}
            {songMeta.composers && (
              <p className="text-xs text-black/50">Compositor(es): {songMeta.composers}</p>
            )}
          </div>
          {settings.showMetadata && (
            <div className="text-xs text-black/60">
              <div>Tom: {transposedKey || "-"}</div>
              <div>Capotraste: {settings.capo ? `Traste ${settings.capo}` : "Não"}</div>
              <div>Afinação: {tuningLabel || "-"}</div>
              {settings.transpose !== 0 && (
                <div>Transposição: {formatTransposeLabel(settings.transpose)}</div>
              )}
              {songMeta.tag && <div>Tag: {songMeta.tag}</div>}
            </div>
          )}
        </div>
      </header>

      <section className="mt-6">
        <div ref={contentRef} className="mono-editor" style={{ ...baseTextStyle, ...columnsStyle }}>
          {renderedBlocks.map((block) => (
            <div
              key={block.key}
              style={block.keepTogether ? keepTogetherStyle : undefined}
            >
              {block.lines.map((line) => (
                <div
                  key={line.key}
                  style={{ color: line.color, whiteSpace: "pre", fontWeight: line.weight }}
                >
                  {line.text.length > 0 ? line.text : "\u00A0"}
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>
      <span
        ref={measureRef}
        className="mono-editor"
        style={{ ...baseTextStyle, position: "absolute", visibility: "hidden", whiteSpace: "pre" }}
        aria-hidden="true"
      >
        M
      </span>
    </div>
  )
}

export default PrintPreview
