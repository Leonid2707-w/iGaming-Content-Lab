import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/Button'

export function NotFoundPage() {
  return (
    <Layout>
      <section className="container-icl flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
        <p className="mb-3 font-display text-8xl font-bold text-icl-accent/20">404</p>
        <h1 className="mb-4 font-display text-3xl font-bold tracking-tight text-icl-text">
          Страница не найдена
        </h1>
        <p className="mb-8 max-w-md text-icl-muted">
          Такой страницы не существует или она была перемещена.
        </p>
        <Button to="/" variant="outline-dark">
          На главную
        </Button>
      </section>
    </Layout>
  )
}
