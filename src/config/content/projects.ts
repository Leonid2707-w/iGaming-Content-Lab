export interface IclProject {
  id: string
  number: string
  label: string
  title: string
  description: string
  task: string
  work: string[]
  highlights: string[]
  result: string
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
    id: 'ai-content-system',
    number: '001',
    label: 'AI Content System for iGaming Community',
    title: 'AI Content System for iGaming Community',
    description:
      'Перестроили производство Telegram/YouTube-контента для крупного iGaming-сообщества и заложили масштабируемый пайплайн.',
    task: 'Снять с команды рутину производства и сохранить единый тон канала при росте объёма.',
    work: [
      'Контент-система для Telegram и YouTube',
      'AI-графика и видеопод ключ',
      'Редакторский контроль и стиль бренда',
    ],
    highlights: ['Единый пайплайн AI + human', 'Масштабирование без потери качества'],
    result: 'Стабильный выпуск контента и понятная операционная модель производства.',
    image: '/images/projects/telegram-content.png',
    imageAlt: 'Система производства Telegram-контента',
    imagePosition: 'center 50%',
    metric: 'AI + Human',
    metricLabel: 'контроль производства',
    tags: ['Telegram', 'YouTube', 'Content Ops'],
    orderPrompt:
      'Хочу модернизировать производство контента по примеру Project 001 — AI Content System.',
    badge: 'Название клиента скрыто по NDA',
    confidential: true,
  },
  {
    id: 'ai-creative-pipeline',
    number: '002',
    label: 'AI Creative Pipeline for Instagram Traffic',
    title: 'AI Creative Pipeline for Instagram Traffic',
    description:
      'Построили поток изображений и видео под iGaming: от концепций до регулярного тестирования гипотез.',
    task: 'Ускорить выпуск креативов для тестов трафика без потери вариативности.',
    work: ['AI-видео и статичные креативы', 'Адаптация под GEO', 'Пакетная выдача гипотез'],
    highlights: ['100+ креативов', 'Регулярный цикл тестов'],
    result: 'Команда получила предсказуемый поток материалов для масштабирования.',
    image: '/images/projects/ai-creatives-laptop.png',
    imageAlt: 'AI-креативы на экране ноутбука',
    imagePosition: 'center 48%',
    metric: '100+',
    metricLabel: 'креативов передано',
    tags: ['AI-видео', 'Instagram', 'Multi-GEO'],
    orderPrompt:
      'Хочу выстроить поток AI-креативов по примеру Project 002 — AI Creative Pipeline.',
    badge: 'Confidential Project',
    confidential: true,
  },
  {
    id: 'ai-agency-website',
    number: '003',
    label: 'AI-Powered Agency Website',
    title: 'AI-Powered Agency Website',
    description:
      'Собрали рабочий MVP сайта агентства: визуальная система, заявки, кабинет и админка.',
    task: 'Быстро запустить digital-витрину с рабочими сценариями заказа и управления.',
    work: ['UX/UI и анимации', 'Форма заявок и кабинет', 'Админ-панель и API'],
    highlights: ['Internal Project', 'Full-stack MVP'],
    result: 'Сайт вышел в прод за дни, а не недели классической разработки.',
    image: '/images/projects/ai-website.png',
    imageAlt: 'Сайт агентства на ноутбуке и смартфоне',
    imagePosition: 'center 48%',
    metric: 'Days',
    metricLabel: 'вместо недель разработки',
    tags: ['AI-разработка', 'UX/UI', 'Full-stack'],
    orderPrompt:
      'Хочу обсудить быстрый запуск сайта по примеру Project 003 — AI-Powered Agency Website.',
    badge: 'Internal Project',
  },
]
