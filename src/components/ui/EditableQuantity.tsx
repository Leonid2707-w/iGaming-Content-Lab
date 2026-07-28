import { useEffect, useId, useRef, useState } from 'react'

function clampToStep(value: number, min: number, max: number, step: number) {
  const safeStep = step > 0 ? step : 1
  const snapped = Math.round((value - min) / safeStep) * safeStep + min
  return Math.min(max, Math.max(min, snapped))
}

interface EditableQuantityProps {
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  /** Extra transform after clamp/step (e.g. video pack snapping). */
  normalize?: (value: number) => number
  suffix?: string
  ariaLabel: string
  className?: string
}

/** Click/tap the value to type it manually (mobile + desktop). */
export function EditableQuantity({
  value,
  min,
  max,
  step = 1,
  onChange,
  normalize,
  suffix,
  ariaLabel,
  className = '',
}: EditableQuantityProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(value))

  useEffect(() => {
    if (!editing) setDraft(String(value))
  }, [editing, value])

  useEffect(() => {
    if (!editing) return
    const input = inputRef.current
    if (!input) return
    input.focus()
    input.select()
  }, [editing])

  function commit(raw: string) {
    const parsed = Number(String(raw).trim().replace(',', '.'))
    if (!Number.isFinite(parsed)) {
      setDraft(String(value))
      setEditing(false)
      return
    }

    let next = clampToStep(parsed, min, max, step)
    if (normalize) next = normalize(next)
    next = Math.min(max, Math.max(min, next))

    onChange(next)
    setDraft(String(next))
    setEditing(false)
  }

  if (editing) {
    return (
      <span className={`inline-flex items-baseline gap-1 ${className}`}>
        <input
          ref={inputRef}
          id={inputId}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          step={step}
          value={draft}
          aria-label={ariaLabel}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => commit(draft)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              commit(draft)
            }
            if (event.key === 'Escape') {
              event.preventDefault()
              setDraft(String(value))
              setEditing(false)
            }
          }}
          className="w-[4.5rem] rounded-lg border border-icl-accent/40 bg-icl-surface px-2 py-1 text-right font-display text-xl font-semibold text-icl-accent outline-none ring-2 ring-icl-accent/20 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        {suffix ? <span className="font-display text-xl font-semibold text-icl-accent">{suffix}</span> : null}
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={`rounded-lg px-1.5 py-0.5 text-right font-display text-xl font-semibold text-icl-accent transition hover:bg-icl-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-icl-accent/30 ${className}`}
      aria-label={`${ariaLabel}: ${value}${suffix ? ` ${suffix}` : ''}. Нажмите, чтобы ввести вручную`}
      title="Нажмите, чтобы ввести вручную"
    >
      {value}
      {suffix ? ` ${suffix}` : ''}
    </button>
  )
}
