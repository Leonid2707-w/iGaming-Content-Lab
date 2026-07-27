import type { ReactNode } from 'react'

interface FormFieldProps {
  label: string
  htmlFor: string
  required?: boolean
  hint?: string
  children: ReactNode
}

export function FormField({ label, htmlFor, required, hint, children }: FormFieldProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block text-sm font-medium text-icl-text">
        {label}
        {required && <span className="text-icl-accent"> *</span>}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-icl-subtle">{hint}</p>}
    </div>
  )
}

export const inputClass = 'input-premium'

export function FormSuccess({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-10 text-center shadow-card backdrop-blur-sm">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-2xl text-icl-success">
        ✓
      </div>
      <p className="mb-2 font-display text-xl font-semibold text-icl-text">{title}</p>
      <p className="text-sm leading-relaxed text-icl-muted">{message}</p>
    </div>
  )
}
