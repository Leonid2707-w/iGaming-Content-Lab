export interface IclProject {
  id: string
  number: string
  label: string
  title: string
  description: string
  image: string
  imageAlt: string
  imagePosition?: string
  metric: string
  metricLabel: string
  tags: string[]
  orderPrompt: string
  badge: string
  confidential?: boolean
}

export const projects: IclProject[] = [
  {
    id: 'ai-creative-pipeline',
    number: '001',
    label: 'AI Creative Pipeline',
    title: 'AI-креативы для Instagram-трафика',
    description:
      'Построили поток изображений и видео под iGaming: от десятков концепций до регулярного тестирования гипотез и адаптации под разные GEO.',
    image: '/images/projects/ai-creatives-laptop.png',
    imageAlt: 'Вертикальный iGaming-видеокреатив на экране ноутбука',
    imagePosition: 'center 48%',
    metric: '100+',
    metricLabel: 'креативов передано клиентам',
    tags: ['AI-видео', 'Instagram', 'Multi-GEO'],
    orderPrompt:
      'Хочу выстроить поток AI-креативов по примеру Project 001 — AI Creative Pipeline.',
    badge: 'Confidential Project',
    confidential: true,
  },
  {
    id: 'ai-agency-website',
    number: '002',
    label: 'AI-Powered Web Development',
    title: 'Сайт агентства за несколько дней',
    description:
      'Создали рабочий MVP с современной визуальной системой, адаптивностью, анимациями, заявками и административной панелью.',
    image: '/images/projects/ai-website.png',
    imageAlt: 'Современный AI-сайт на ноутбуке и смартфоне',
    imagePosition: 'center 48%',
    metric: 'Days',
    metricLabel: 'вместо нескольких недель разработки',
    tags: ['AI-разработка', 'UX/UI', 'Full-stack'],
    orderPrompt:
      'Хочу обсудить быстрый запуск сайта по примеру Project 002 — AI-Powered Web Development.',
    badge: 'Internal Project',
  },
  {
    id: 'ai-content-system',
    number: '003',
    label: 'AI Content System',
    title: 'Контент для крупного iGaming-сообщества',
    description:
      'Перестроили Telegram-контент, подключили AI-графику и видео, YouTube-продакшн и заложили единый масштабируемый пайплайн.',
    image: '/images/projects/telegram-content.png',
    imageAlt: 'Система производства Telegram-контента на ноутбуке и смартфоне',
    imagePosition: 'center 50%',
    metric: 'AI + Human',
    metricLabel: 'единый контроль производства',
    tags: ['Telegram', 'YouTube', 'Content Ops'],
    orderPrompt:
      'Хочу модернизировать производство контента по примеру Project 003 — AI Content System.',
    badge: 'Название скрыто по NDA',
    confidential: true,
  },
]

