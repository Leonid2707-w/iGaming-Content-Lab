import { Link } from 'react-router-dom'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { footerLinks } from '@/config/navigation'
import { siteConfig } from '@/config/site'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="relative overflow-hidden border-t border-icl-border bg-icl-surface text-icl-text">
      <div className="pointer-events-none absolute inset-0 bg-mesh-dark opacity-60" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-40" aria-hidden="true" />

      <div className="container-icl relative py-12 sm:py-16 lg:py-20">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Link to="/" className="mb-5 inline-flex sm:mb-6">
              <BrandLogo variant="full" className="h-14 transition duration-300 hover:scale-[1.02] sm:h-20 lg:h-24" />
            </Link>
            <p className="mb-8 max-w-sm text-sm leading-relaxed text-icl-muted">
              {siteConfig.tagline}. Контент для вебмастеров и команд в iGaming.
            </p>
            <div className="flex flex-col gap-2 text-sm">
              <a
                href={siteConfig.supportTelegramUrl}
                className="w-fit text-icl-accent transition hover:text-icl-accent-hover"
                target="_blank"
                rel="noopener noreferrer"
              >
                Поддержка {siteConfig.contactTelegram}
              </a>
            </div>
          </div>

          <div>
            <h3 className="mb-5 text-xs font-semibold uppercase tracking-[0.15em] text-icl-subtle">
              Услуги
            </h3>
            <ul className="space-y-3">
              {footerLinks.services.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-icl-muted transition hover:text-icl-accent"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-5 text-xs font-semibold uppercase tracking-[0.15em] text-icl-subtle">
              Компания
            </h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-icl-muted transition hover:text-icl-accent"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 space-y-5 border-t border-icl-border pt-6 text-sm text-icl-subtle sm:mt-16 sm:pt-8">
          <p className="max-w-4xl text-xs leading-relaxed sm:text-sm">
            Сайт использует Cookie-файлы и сходные технологии для обеспечения работы сервиса,
            сохранения настроек (например, темы и сессии) и улучшения пользовательского опыта.
            Продолжая пользоваться сайтом, вы подтверждаете информированность об обработке данных
            с помощью Cookie. Подробнее — в{' '}
            <Link to="/legal/personal-data" className="text-icl-accent hover:underline">
              Политике обработки персональных данных
            </Link>
            .
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs sm:text-sm">
              &copy; {year} {siteConfig.name}. Все права защищены.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-2">
              <Link to="/legal/terms" className="hover:text-icl-accent">
                Пользовательское соглашение
              </Link>
              <Link to="/legal/privacy" className="hover:text-icl-accent">
                Политика конфиденциальности
              </Link>
              <Link to="/legal/personal-data" className="hover:text-icl-accent">
                Политика обработки персональных данных
              </Link>
              <p className="font-medium text-icl-accent">{siteConfig.domain}</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
