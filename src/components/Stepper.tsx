type StepperProps = {
  steps: string[]
  currentStep: number
  onStepChange?: (index: number) => void
  isStepEnabled?: (index: number) => boolean
}

const Stepper = ({ steps, currentStep, onStepChange, isStepEnabled }: StepperProps) => {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {steps.map((label, index) => {
        const isActive = index === currentStep
        const isCompleted = index < currentStep
        const enabledByRule = isStepEnabled ? isStepEnabled(index) : index <= currentStep
        const canClick = Boolean(onStepChange) && enabledByRule
        return (
          <button
            key={label}
            type="button"
            onClick={() => canClick && onStepChange?.(index)}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
              isActive
                ? "step-pill font-semibold"
                : isCompleted
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-black/10 bg-white/70 text-black/50"
            }`}
            disabled={!canClick}
          >
            <span className="text-xs font-semibold">{index + 1}</span>
            <span>{label}</span>
          </button>
        )
      })}
    </div>
  )
}

export default Stepper
