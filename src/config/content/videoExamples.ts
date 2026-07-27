export type VideoExampleGroupId = 'video-creative' | 'ai-video'

export interface VideoExampleItem {
  id: string
  title: string
  src: string
  poster: string
}

export interface VideoPackSettings {
  pricePer10: number
  minimum: number
  maximum: number
  step: number
}

export interface VideoExamplesState {
  groups: Record<VideoExampleGroupId, VideoExampleItem[]>
  settings: Record<VideoExampleGroupId, VideoPackSettings>
}

export const VIDEO_EXAMPLE_GROUPS: {
  id: VideoExampleGroupId
  title: string
  description: string
}[] = [
  {
    id: 'video-creative',
    title: 'Видео-креативы',
    description: 'Геймплейные рекламные ролики с музыкой и текстом.',
  },
  {
    id: 'ai-video',
    title: 'AI-видеокреативы',
    description: 'Креативы со стримерами, геймплеем и AI-элементами.',
  },
]

export const VIDEO_EXAMPLES_PER_GROUP = 3
export const VIDEO_MAX_BYTES = 50 * 1024 * 1024

export function createDefaultVideoExamples(): VideoExamplesState {
  return {
    groups: {
      'video-creative': [
        {
          id: 'video_1',
          title: 'Видео-креатив 01',
          src: '/videos/examples/video_1.mp4',
          poster: '/videos/posters/video_1.jpg',
        },
        {
          id: 'video_2',
          title: 'Видео-креатив 02',
          src: '/videos/examples/video_2.mp4',
          poster: '/videos/posters/video_2.jpg',
        },
        {
          id: 'video_3',
          title: 'Видео-креатив 03',
          src: '/videos/examples/video_3.mp4',
          poster: '/videos/posters/video_3.jpg',
        },
      ],
      'ai-video': [
        {
          id: 'video_4',
          title: 'AI-видеокреатив 01',
          src: '/videos/examples/video_4.mp4',
          poster: '/videos/posters/video_4.jpg',
        },
        {
          id: 'video_5',
          title: 'AI-видеокреатив 02',
          src: '/videos/examples/video_5.mp4',
          poster: '/videos/posters/video_5.jpg',
        },
        {
          id: 'video_6',
          title: 'AI-видеокреатив 03',
          src: '/videos/examples/video_6.mp4',
          poster: '/videos/posters/video_6.jpg',
        },
      ],
    },
    settings: {
      'video-creative': {
        pricePer10: 10,
        minimum: 10,
        maximum: 1000,
        step: 5,
      },
      'ai-video': {
        pricePer10: 15,
        minimum: 10,
        maximum: 1000,
        step: 5,
      },
    },
  }
}

export function calcVideoPackTotal(quantity: number, pricePer10: number) {
  if (!Number.isFinite(quantity) || !Number.isFinite(pricePer10)) return 0
  return (quantity / 10) * pricePer10
}

export function formatVideoPackPrice(pricePer10: number) {
  const amount = pricePer10 % 1 === 0 ? `${pricePer10}$` : `${pricePer10.toFixed(1)}$`
  return {
    primary: amount,
    secondary: '/ 10 шт',
  }
}

export function snapVideoQuantity(
  value: number,
  settings: VideoPackSettings,
) {
  const step = Math.max(1, settings.step)
  const clamped = Math.min(settings.maximum, Math.max(settings.minimum, value))
  const snapped = Math.round((clamped - settings.minimum) / step) * step + settings.minimum
  return Math.min(settings.maximum, Math.max(settings.minimum, snapped))
}
