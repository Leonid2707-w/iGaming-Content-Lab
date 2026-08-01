import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class RouteErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ui]', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
          <h1 className="font-display text-2xl font-semibold text-icl-text">Что-то пошло не так</h1>
          <p className="max-w-md text-sm text-icl-muted">
            Обновите страницу. Если ошибка повторяется — напишите в поддержку.
          </p>
          <Button type="button" onClick={() => window.location.assign('/')}>
            На главную
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}
