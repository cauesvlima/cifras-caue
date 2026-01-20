import type { PrintSettings, SongMeta } from "../types"
import { formatTransposeLabel, transposeChordLine, transposeKeyName } from "../utils/chords"

type PrintPreviewProps = {
  songMeta: SongMeta
  chartText: string
  settings: PrintSettings
}

const PrintPreview = ({ songMeta, chartText, settings }: PrintPreviewProps) => {
  const tuningLabel =
    songMeta.tuning === "custom" ? songMeta.customTuning || "Custom" : songMeta.tuning
  const transposedKey = transposeKeyName(songMeta.key, settings.transpose, settings.preferFlats)
  const lines = chartText.split(/\r?\n/)
  const renderedLines = lines.flatMap((line, index) => {
    const isChordLine = index % 2 === 0
    if (isChordLine && !settings.showChords) return []
    const text = isChordLine
      ? transposeChordLine(line, settings.transpose, settings.preferFlats)
      : line
    return [
      {
        key: `${index}-${isChordLine ? "c" : "l"}`,
        text,
        color: isChordLine ? settings.chordColor : settings.textColor,
      },
    ]
  })

  const baseTextStyle = {
    fontSize: `${settings.fontSize}px`,
    lineHeight: settings.lineHeight,
  }

  return (
    <div className="a4-page mx-auto">
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
        <pre className="mono-editor whitespace-pre" style={baseTextStyle}>
          {renderedLines.map((line, index) => (
            <span key={line.key} style={{ color: line.color }}>
              {line.text}
              {index < renderedLines.length - 1 ? "\n" : ""}
            </span>
          ))}
        </pre>
      </section>
    </div>
  )
}

export default PrintPreview
