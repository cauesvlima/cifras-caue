type RawLyricsInputProps = {
  value: string
  onChange: (next: string) => void
  onBack: () => void
  onConfirm: () => void
}

const RawLyricsInput = ({ value, onChange, onBack, onConfirm }: RawLyricsInputProps) => {
  return (
    <div className="card-surface space-y-6 p-6 md:p-8">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-[#8a6b4f]">Etapa 2</p>
        <h2 className="mt-2 text-2xl font-semibold">Colar letra crua</h2>
        <p className="mt-2 text-sm text-black/60">
          Cole apenas a letra, sem acordes. As quebras de linha serão mantidas.
        </p>
      </div>

      <textarea
        className="mono-editor h-[320px] w-full rounded-2xl border border-black/10 bg-white/70 p-4 text-sm shadow-sm"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Cole aqui a letra completa..."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-black/10 px-6 py-3 text-sm font-semibold text-black/70 transition hover:bg-black/5"
        >
          Voltar
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-full bg-[#1f1a17] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#3a2c26]"
        >
          Confirmar letra
        </button>
      </div>
    </div>
  )
}

export default RawLyricsInput
