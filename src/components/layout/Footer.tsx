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

      <div className="container-icl relative py-20">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Link to="/" className="mb-6 inline-flex">
              <BrandLogo variant="full" className="h-24 transition duration-300 hover:scale-[1.02]" />
            </Link>
            <p className="mb-8 max-w-sm text-sm leading-relaxed text-icl-muted">
              {siteConfig.tagline}. Контент для вебмастеров и команд в iGaming.
            </p>
            <div className="flex flex-col gap-2 text-sm">
              <a
                href={`mailto:${siteConfig.contactEmail}`}
                className="w-fit text-icl-accent transition hover:text-icl-accent-hover"
              >
                {siteConfig.contactEmail}
              </a>
              <a
                href={`https://t.me/${siteConfig.contactTelegram.replace('@', '')}`}
                className="w-fit text-icl-muted transition hover:text-icl-text"
                target="_blank"
                rel="noopener noreferrer"
              >
                {siteConfig.contactTelegram}
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

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-icl-border pt-8 text-sm text-icl-subtle sm:flex-row">
          <p>&copy; {year} {siteConfig.name}. Все права защищены.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <Link to="/legal/terms" className="hover:text-icl-accent">
              Соглашение
            </Link>
            <Link to="/legal/privacy" className="hover:text-icl-accent">
              Конфиденциальность
            </Link>
            <Link to="/legal/personal-data" className="hover:text-icl-accent">
              Персональные данные
            </Link>
            <p className="font-medium text-icl-accent">{siteConfig.domain}</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
