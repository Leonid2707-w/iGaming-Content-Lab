interface AdminPlaceholderPageProps {
  title: string
  description: string
}

export function AdminPlaceholderPage({ title, description }: AdminPlaceholderPageProps) {
  return (
    <div className="rounded-2xl border border-icl-border bg-icl-card p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-icl-accent">
        Раздел в каркасе
      </p>
      <h1 className="mt-3 font-display text-2xl font-semibold text-icl-text">{title}</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-icl-muted">{description}</p>
      <p className="mt-6 rounded-xl border border-icl-border bg-icl-surface px-4 py-3 text-sm text-icl-muted">
        Полное ТЗ для этого раздела ещё не зафиксировано — структура уже заложена.
      </p>
    </div>
  )
}
