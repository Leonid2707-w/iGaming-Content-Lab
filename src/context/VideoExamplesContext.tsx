/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  createDefaultVideoExamples,
  VIDEO_EXAMPLES_PER_GROUP,
  type VideoExampleGroupId,
  type VideoExampleItem,
  type VideoExamplesState,
  type VideoPackSettings,
} from '@/config/content/videoExamples'
import { useServices } from '@/context/ServicesContext'

const STORAGE_KEY = 'icl-video-examples-v1'

interface VideoExamplesContextValue {
  state: VideoExamplesState
  getExamples: (groupId: VideoExampleGroupId) => VideoExampleItem[]
  getSettings: (groupId: VideoExampleGroupId) => VideoPackSettings
  updateSettings: (groupId: VideoExampleGroupId, patch: Partial<VideoPackSettings>) => void
  updateExample: (
    groupId: VideoExampleGroupId,
    exampleId: string,
    patch: Partial<VideoExampleItem>,
  ) => void
  replaceExample: (
    groupId: VideoExampleGroupId,
    exampleId: string,
    next: VideoExampleItem,
  ) => void
  removeExampleMedia: (groupId: VideoExampleGroupId, exampleId: string) => void
  moveExample: (
    groupId: VideoExampleGroupId,
    exampleId: string,
    direction: 'up' | 'down',
  ) => void
  resetExamples: () => void
}

const VideoExamplesContext = createContext<VideoExamplesContextValue | null>(null)

function loadState(): VideoExamplesState {
  const defaults = createDefaultVideoExamples()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaults
    const parsed = JSON.parse(raw) as Partial<VideoExamplesState>
    const groups = { ...defaults.groups }
    const settings = { ...defaults.settings }

    for (const groupId of Object.keys(defaults.groups) as VideoExampleGroupId[]) {
      const savedGroup = parsed.groups?.[groupId]
      if (Array.isArray(savedGroup) && savedGroup.length) {
        groups[groupId] = defaults.groups[groupId].map((fallback, index) => {
          const saved = savedGroup[index]
          if (!saved) return fallback
          return {
            ...fallback,
            ...saved,
            id: fallback.id,
          }
        })
      }
      const savedSettings = parsed.settings?.[groupId]
      if (savedSettings) {
        settings[groupId] = {
          ...defaults.settings[groupId],
          ...savedSettings,
        }
      }
    }

    return { groups, settings }
  } catch {
    return defaults
  }
}

function persist(state: VideoExamplesState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function VideoExamplesProvider({ children }: { children: ReactNode }) {
  const { updateService } = useServices()
  const [state, setState] = useState<VideoExamplesState>(() => loadState())

  const syncServicePricing = useCallback(
    (groupId: VideoExampleGroupId, settings: VideoPackSettings) => {
      updateService(groupId, {
        priceMode: 'numeric',
        price: settings.pricePer10,
        pricePrefix: undefined,
        unitId: 'per_piece',
        unit: 'piece',
        unitLabel: 'за 10 штук',
        minimum: settings.minimum,
        maximum: settings.maximum,
        step: settings.step,
      })
    },
    [updateService],
  )

  useEffect(() => {
    syncServicePricing('video-creative', state.settings['video-creative'])
    syncServicePricing('ai-video', state.settings['ai-video'])
    // Sync catalog prices once on mount from portfolio settings.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const commit = useCallback((next: VideoExamplesState) => {
    persist(next)
    setState(next)
  }, [])

  const getExamples = useCallback(
    (groupId: VideoExampleGroupId) => state.groups[groupId] ?? [],
    [state.groups],
  )

  const getSettings = useCallback(
    (groupId: VideoExampleGroupId) => state.settings[groupId],
    [state.settings],
  )

  const updateSettings = useCallback(
    (groupId: VideoExampleGroupId, patch: Partial<VideoPackSettings>) => {
      setState((current) => {
        const nextSettings = {
          ...current.settings[groupId],
          ...patch,
        }
        const next = {
          ...current,
          settings: {
            ...current.settings,
            [groupId]: nextSettings,
          },
        }
        persist(next)
        syncServicePricing(groupId, nextSettings)
        return next
      })
    },
    [syncServicePricing],
  )

  const updateExample = useCallback(
    (
      groupId: VideoExampleGroupId,
      exampleId: string,
      patch: Partial<VideoExampleItem>,
    ) => {
      setState((current) => {
        const next = {
          ...current,
          groups: {
            ...current.groups,
            [groupId]: current.groups[groupId].map((item) =>
              item.id === exampleId ? { ...item, ...patch, id: item.id } : item,
            ),
          },
        }
        persist(next)
        return next
      })
    },
    [],
  )

  const replaceExample = useCallback(
    (groupId: VideoExampleGroupId, exampleId: string, nextItem: VideoExampleItem) => {
      updateExample(groupId, exampleId, nextItem)
    },
    [updateExample],
  )

  const removeExampleMedia = useCallback(
    (groupId: VideoExampleGroupId, exampleId: string) => {
      updateExample(groupId, exampleId, { src: '', poster: '' })
    },
    [updateExample],
  )

  const moveExample = useCallback(
    (groupId: VideoExampleGroupId, exampleId: string, direction: 'up' | 'down') => {
      setState((current) => {
        const list = [...current.groups[groupId]]
        const index = list.findIndex((item) => item.id === exampleId)
        if (index < 0) return current
        const target = direction === 'up' ? index - 1 : index + 1
        if (target < 0 || target >= list.length) return current
        ;[list[index], list[target]] = [list[target], list[index]]
        const next = {
          ...current,
          groups: {
            ...current.groups,
            [groupId]: list,
          },
        }
        persist(next)
        return next
      })
    },
    [],
  )

  const resetExamples = useCallback(() => {
    const defaults = createDefaultVideoExamples()
    commit(defaults)
    syncServicePricing('video-creative', defaults.settings['video-creative'])
    syncServicePricing('ai-video', defaults.settings['ai-video'])
  }, [commit, syncServicePricing])

  const value = useMemo<VideoExamplesContextValue>(
    () => ({
      state,
      getExamples,
      getSettings,
      updateSettings,
      updateExample,
      replaceExample,
      removeExampleMedia,
      moveExample,
      resetExamples,
    }),
    [
      state,
      getExamples,
      getSettings,
      updateSettings,
      updateExample,
      replaceExample,
      removeExampleMedia,
      moveExample,
      resetExamples,
    ],
  )

  return (
    <VideoExamplesContext.Provider value={value}>{children}</VideoExamplesContext.Provider>
  )
}

export function useVideoExamples() {
  const context = useContext(VideoExamplesContext)
  if (!context) {
    throw new Error('useVideoExamples must be used within VideoExamplesProvider')
  }
  return context
}

export { VIDEO_EXAMPLES_PER_GROUP }
