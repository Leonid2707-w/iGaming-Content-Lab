import { Cpu, Globe2, Layers3, ShieldCheck } from 'lucide-react'
import { motion, useAnimationControls, useReducedMotion } from 'motion/react'
import { useRef } from 'react'

const capabilities = [
  {
    label: 'iGaming',
    caption: 'Специализация',
    icon: ShieldCheck,
    position: 'left-0 top-[12%] sm:left-[2%]',
  },
  {
    label: 'Multi-GEO',
    caption: 'Любые рынки',
    icon: Globe2,
    position: 'right-0 top-[22%] sm:right-[2%]',
  },
  {
    label: 'AI + Human',
    caption: 'Технологии и контроль',
    icon: Cpu,
    position: 'bottom-[20%] left-0 sm:left-[3%]',
  },
  {
    label: 'Scale-ready',
    caption: 'Готово к росту',
    icon: Layers3,
    position: 'bottom-[8%] right-0 sm:right-[4%]',
  },
]

const rest = { scale: 1, y: 0, rotate: 0, rotateY: 0 }

export function HeroVisual() {
  const reduceMotion = useReducedMotion()
  const controls = useAnimationControls()
  const hovering = useRef(false)

  async function playHover() {
    hovering.current = true
    if (reduceMotion) {
      await controls.start({ scale: 1.03, y: -4, transition: { duration: 0.2 } })
      return
    }

    await controls.start({
      scale: [1, 1.07, 1.04],
      y: [0, -14, -8],
      rotate: [0, -3, -1.5],
      rotateY: [0, 8, 5],
      transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
    })

    if (!hovering.current) return

    // Soft idle rock while the cursor stays over the machine
    void controls.start({
      y: [-8, -12, -8],
      rotate: [-1.5, 1, -1.5],
      transition: { duration: 1.6, ease: 'easeInOut', repeat: Infinity },
    })
  }

  async function playLeave() {
    hovering.current = false
    await controls.start({
      ...rest,
      transition: reduceMotion
        ? { duration: 0.15 }
        : { type: 'spring', stiffness: 320, damping: 24 },
    })
  }

  async function playPress() {
    hovering.current = false
    if (reduceMotion) {
      await controls.start({ scale: 0.98, transition: { duration: 0.12 } })
      await controls.start({ ...rest, transition: { duration: 0.15 } })
      return
    }

    await controls.start({
      scale: [1, 0.95, 1.05, 1],
      y: [0, 8, -6, 0],
      rotate: [0, 2, -1.5, 0],
      rotateY: [0, -4, 2, 0],
      transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
    })
  }

  return (
    <div className="relative mx-auto min-h-[300px] w-full max-w-xl sm:min-h-[400px] lg:min-h-[470px]">
      <div
        className="hero-slot-halo pointer-events-none absolute left-1/2 top-1/2 h-[62%] w-[62%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500/15 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="hero-slot-orbit pointer-events-none absolute left-1/2 top-1/2 h-[72%] w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-icl-accent/20"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[54%] w-[54%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-icl-border/70"
        aria-hidden="true"
      />

      <div className="absolute inset-0 flex items-center justify-center px-10 sm:px-14">
        <div className="hero-slot-machine relative z-10 w-[82%] max-w-[430px]">
          <motion.button
            type="button"
            animate={controls}
            initial={rest}
            onHoverStart={() => void playHover()}
            onHoverEnd={() => void playLeave()}
            onTap={() => void playPress()}
            aria-label="Игровой автомат iGaming Content Lab"
            className="relative block w-full touch-manipulation cursor-pointer select-none rounded-[28%] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-icl-accent/25"
            style={{ transformOrigin: '50% 70%', transformStyle: 'preserve-3d' }}
          >
            <img
              src="/images/hero-slot-machine.png"
              alt="Красный игровой автомат 777 — символ iGaming-специализации iCL"
              width={624}
              height={525}
              fetchPriority="high"
              decoding="async"
              draggable={false}
              className="pointer-events-none w-full"
            />
          </motion.button>
        </div>
      </div>

      {capabilities.map((item, index) => {
        const Icon = item.icon
        return (
          <div
            key={item.label}
            className={`hero-capability pointer-events-none absolute z-20 flex items-center gap-2.5 rounded-2xl border border-icl-border/80 bg-icl-card/85 px-3 py-2.5 shadow-card backdrop-blur-xl sm:px-4 ${item.position} ${
              index > 1 ? 'hidden sm:flex' : 'flex'
            }`}
            style={{ animationDelay: `${index * -1.4}s` }}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-icl-accent-soft text-icl-accent">
              <Icon size={15} aria-hidden="true" />
            </span>
            <span>
              <span className="block text-xs font-semibold text-icl-text sm:text-sm">
                {item.label}
              </span>
              <span className="hidden text-[10px] text-icl-subtle sm:block">
                {item.caption}
              </span>
            </span>
          </div>
        )
      })}

      <div className="pointer-events-none absolute bottom-[2%] left-1/2 z-20 -translate-x-1/2 rounded-full border border-emerald-500/20 bg-icl-card/85 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-500 shadow-card backdrop-blur-xl sm:bottom-0">
        <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Content system online
      </div>

      <div
        className="pointer-events-none absolute bottom-[14%] left-1/2 h-10 w-[48%] -translate-x-1/2 rounded-[50%] bg-slate-950/35 blur-xl"
        aria-hidden="true"
      />
    </div>
  )
}
