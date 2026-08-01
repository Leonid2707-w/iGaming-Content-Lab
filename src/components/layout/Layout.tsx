import type { ReactNode } from 'react'
import { AnimatedBackground } from '@/components/layout/AnimatedBackground'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

interface LayoutProps {
  children: ReactNode
  className?: string
}

export function Layout({ children, className = '' }: LayoutProps) {
  return (
    <div className={`flex min-h-screen flex-col bg-icl-bg ${className}`}>
      <AnimatedBackground />
      <Header />
      <main id="main-content" className="relative flex-1 scroll-mt-20">
        {children}
      </main>
      <Footer />
    </div>
  )
}
