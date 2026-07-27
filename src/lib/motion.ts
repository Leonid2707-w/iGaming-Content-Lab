import type { Transition, Variants } from 'motion/react'

/** Soft Apple / Linear / Vercel-style easing */
export const easeOutSoft: [number, number, number, number] = [0.22, 1, 0.36, 1]
export const easeInOutSoft: [number, number, number, number] = [0.4, 0, 0.2, 1]

export const duration = {
  fast: 0.28,
  base: 0.45,
  slow: 0.6,
} as const

export const transitionBase: Transition = {
  duration: duration.base,
  ease: easeOutSoft,
}

export const transitionFast: Transition = {
  duration: duration.fast,
  ease: easeOutSoft,
}

export const transitionSpringSoft: Transition = {
  type: 'spring',
  stiffness: 280,
  damping: 28,
  mass: 0.8,
}

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
}

export const fadeLeft: Variants = {
  hidden: { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0 },
}

export const fadeRight: Variants = {
  hidden: { opacity: 0, x: 16 },
  visible: { opacity: 1, x: 0 },
}

export const fadeScale: Variants = {
  hidden: { opacity: 0, y: 10, scale: 0.985 },
  visible: { opacity: 1, y: 0, scale: 1 },
}

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.04,
    },
  },
}

export const cardHover = {
  y: -4,
  transition: transitionFast,
}

export const cardTap = {
  scale: 0.985,
  transition: { duration: 0.15 },
}

export const buttonHover = {
  y: -2,
  transition: transitionFast,
}

export const buttonTap = {
  scale: 0.98,
  transition: { duration: 0.12 },
}

export const modalBackdrop: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
}

export const modalPanel: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 12, scale: 0.98 },
}

export const stepSlide: Variants = {
  hidden: { opacity: 0, x: 12 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -10 },
}
