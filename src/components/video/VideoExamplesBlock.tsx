import { VideoExamplesTrigger } from '@/components/video/VideoExamplesTrigger'
import type { VideoExampleGroupId } from '@/config/content/videoExamples'

interface VideoExamplesBlockProps {
  groupId: VideoExampleGroupId
  title?: string
  subtitle?: string
  compact?: boolean
  className?: string
}

/** Compact examples entry used in order form and elsewhere */
export function VideoExamplesBlock({
  groupId,
  title = 'Примеры работ',
  subtitle,
  className = '',
}: VideoExamplesBlockProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {subtitle && <p className="text-xs text-icl-muted">{subtitle}</p>}
      <VideoExamplesTrigger groupId={groupId} title={title} />
    </div>
  )
}
