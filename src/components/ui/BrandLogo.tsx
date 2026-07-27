import { useTheme } from '@/context/ThemeContext'

interface BrandLogoProps {
  variant?: 'mark' | 'full'
  className?: string
}

const dimensions = {
  mark: { width: 662, height: 268 },
  full: { width: 700, height: 424 },
} as const

export function BrandLogo({ variant = 'mark', className = '' }: BrandLogoProps) {
  const { theme } = useTheme()
  const suffix = variant === 'mark' ? `mark-${theme}` : theme
  const size = dimensions[variant]

  return (
    <img
      src={`/images/logo-${suffix}.png`}
      alt="iGaming Content Lab"
      className={`block w-auto object-contain ${className}`}
      width={size.width}
      height={size.height}
      decoding="async"
    />
  )
}
