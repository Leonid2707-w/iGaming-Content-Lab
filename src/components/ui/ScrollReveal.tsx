import { motion, useReducedMotion, type Variants } from 'motion/react'
import type { ReactNode } from 'react'
import {
  duration,
  easeOutSoft,
  fadeLeft,
  fadeRight,
  fadeScale,
  fadeUp,
} from '@/lib/motion'

interface ScrollRevealProps {
  children: ReactNode
  className?: string
  delay?: number
  variant?: 'up' | 'left' | 'right' | 'scale'
}

const variants: Record<NonNullable<ScrollRevealProps['variant']>, Variants> = {
  up: fadeUp,
  left: fadeLeft,
  right: fadeRight,
  scale: fadeScale,
}

export function ScrollReveal({
  children,
  className = '',
  delay = 0,
  variant = 'up',
}: ScrollRevealProps) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      variants={variants[variant]}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.16, margin: '0px 0px -48px 0px' }}
      transition={{
        duration: duration.slow,
        ease: easeOutSoft,
        delay: delay / 1000,
      }}
    >
      {children}
    </motion.div>
  )
}
