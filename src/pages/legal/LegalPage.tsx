import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { Layout } from '@/components/layout/Layout'
import { BrandLogo } from '@/components/ui/BrandLogo'

export function LegalPage({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <Layout>
      <div className="container-icl py-12 sm:py-16">
        <Link to="/" className="mb-8 inline-flex">
          <BrandLogo className="h-8" />
        </Link>
        <article className="mx-auto max-w-3xl rounded-[28px] border border-icl-border bg-icl-card p-6 shadow-card sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-icl-subtle">
            Юридические документы
          </p>
          <h1 className="mt-3 font-display text-3xl font-semibold text-icl-text">{title}</h1>
          <div className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
            Временный шаблон текста. Будет заменён на финальную юридическую редакцию.
          </div>
          <div className="prose-icl mt-8 space-y-4 text-sm leading-relaxed text-icl-muted">
            {children}
          </div>
        </article>
      </div>
    </Layout>
  )
}

export function TermsPage() {
  return (
    <LegalPage title="Пользовательское соглашение">
      <p>
        Настоящее Пользовательское соглашение регулирует порядок использования сайта и сервисов
        iGaming Content Lab (iCL). Используя сайт, вы подтверждаете согласие с условиями.
      </p>
      <p>
        Пользователь обязуется предоставлять достоверные данные при регистрации и не использовать
        сервис в целях, нарушающих применимое законодательство.
      </p>
      <p>
        iCL вправе изменять функциональность сервиса, а также обновлять условия соглашения. Актуальная
        версия публикуется на этой странице.
      </p>
    </LegalPage>
  )
}

export function PrivacyPage() {
  return (
    <LegalPage title="Политика конфиденциальности">
      <p>
        Политика описывает, какие данные мы можем получать при использовании сайта iCL, и как они
        обрабатываются для оказания услуг и поддержки пользователей.
      </p>
      <p>
        Мы стремимся применять разумные меры защиты данных и не передаём их третьим лицам без
        законных оснований, кроме случаев, необходимых для оказания услуги (например, инфраструктура
        хостинга и почтовые сервисы).
      </p>
      <p>
        По вопросам, связанным с конфиденциальностью, вы можете связаться с нами через контакты на
        сайте.
      </p>
    </LegalPage>
  )
}

export function PersonalDataPage() {
  return (
    <LegalPage title="Политика обработки персональных данных">
      <p>
        Настоящая политика определяет порядок обработки персональных данных пользователей iCL,
        включая регистрационные данные, контактные сведения и сведения, необходимые для исполнения
        заказов.
      </p>
      <p>
        Правовые основания обработки включают согласие субъекта персональных данных и необходимость
        исполнения договора / заявки на оказание услуг.
      </p>
      <p>
        Пользователь вправе запросить уточнение, обновление или удаление данных в пределах,
        предусмотренных применимым законодательством, обратившись в поддержку iCL.
      </p>
    </LegalPage>
  )
}
