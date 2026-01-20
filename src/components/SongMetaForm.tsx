import type { SongMeta } from "../types"

const KEY_OPTIONS = [
  "C",
  "C#",
  "D",
  "Eb",
  "E",
  "F",
  "F#",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
  "Cm",
  "C#m",
  "Dm",
  "Ebm",
  "Em",
  "Fm",
  "F#m",
  "Gm",
  "Abm",
  "Am",
  "Bbm",
  "Bm",
]

const TUNING_OPTIONS = [
  { value: "E A D G B E", label: "Padrão (E A D G B E)" },
  { value: "Eb Ab Db Gb Bb Eb", label: "Meio tom abaixo (Eb Ab Db Gb Bb Eb)" },
  { value: "D A D G B E", label: "Drop D (D A D G B E)" },
  { value: "D A D G A D", label: "DADGAD (D A D G A D)" },
  { value: "C G C F A D", label: "C G C F A D" },
  { value: "custom", label: "Customizada" },
]

type SongMetaFormProps = {
  value: SongMeta
  onChange: (next: SongMeta) => void
  onNext: () => void
  showErrors: boolean
}

const SongMetaForm = ({ value, onChange, onNext, showErrors }: SongMetaFormProps) => {
  const update = <K extends keyof SongMeta>(field: K, nextValue: SongMeta[K]) => {
    onChange({ ...value, [field]: nextValue })
  }

  const showTitleError = showErrors && value.title.trim().length === 0
  const showKeyError = showErrors && value.key.trim().length === 0

  return (
    <div className="card-surface space-y-6 p-6 md:p-8">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-[#8a6b4f]">Etapa 1</p>
        <h2 className="mt-2 text-2xl font-semibold">Cadastro da música</h2>
        <p className="mt-2 text-sm text-black/60">
          Preencha os metadados básicos. O título e o tom são obrigatórios.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium">
          Título da música *
          <input
            className={`rounded-xl border px-4 py-2 ${
              showTitleError ? "border-red-400" : "border-black/10"
            }`}
            value={value.title}
            onChange={(event) => update("title", event.target.value)}
            placeholder="Ex.: Grande é o Senhor"
          />
          {showTitleError && <span className="text-xs text-red-500">Título é obrigatório.</span>}
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium">
          Artista / Banda
          <input
            className="rounded-xl border border-black/10 px-4 py-2"
            value={value.artist}
            onChange={(event) => update("artist", event.target.value)}
            placeholder="Ex.: Ministério Luz"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium">
          Compositor(es)
          <input
            className="rounded-xl border border-black/10 px-4 py-2"
            value={value.composers}
            onChange={(event) => update("composers", event.target.value)}
            placeholder="Texto livre"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium">
          Tom (Key) *
          <select
            className={`rounded-xl border px-4 py-2 ${
              showKeyError ? "border-red-400" : "border-black/10"
            }`}
            value={value.key}
            onChange={(event) => update("key", event.target.value)}
          >
            <option value="">Selecione</option>
            {KEY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {showKeyError && <span className="text-xs text-red-500">Tom é obrigatório.</span>}
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium">
          Capotraste
          <select
            className="rounded-xl border border-black/10 px-4 py-2"
            value={value.capo}
            onChange={(event) => update("capo", Number(event.target.value))}
          >
            <option value={0}>Não</option>
            {Array.from({ length: 12 }, (_, index) => index + 1).map((capo) => (
              <option key={capo} value={capo}>
                Traste {capo}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium">
          Afinação
          <select
            className="rounded-xl border border-black/10 px-4 py-2"
            value={value.tuning}
            onChange={(event) => update("tuning", event.target.value)}
          >
            {TUNING_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {value.tuning === "custom" && (
          <label className="flex flex-col gap-2 text-sm font-medium">
            Afinação custom
            <input
              className="rounded-xl border border-black/10 px-4 py-2"
              value={value.customTuning}
              onChange={(event) => update("customTuning", event.target.value)}
              placeholder="Ex.: E A D G B E"
            />
          </label>
        )}

        <label className="flex flex-col gap-2 text-sm font-medium">
          Categoria/Tag
          <input
            className="rounded-xl border border-black/10 px-4 py-2"
            value={value.tag}
            onChange={(event) => update("tag", event.target.value)}
            placeholder="Ex.: Principal, Louvor"
          />
        </label>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onNext}
          className="rounded-full bg-[#1f1a17] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#3a2c26]"
        >
          Avançar
        </button>
      </div>
    </div>
  )
}

export default SongMetaForm
