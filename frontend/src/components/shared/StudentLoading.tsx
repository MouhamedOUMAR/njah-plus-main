import Skeleton from '@/components/ui/Skeleton'

type Variant = 'dashboard' | 'courses' | 'detail' | 'lesson' | 'list' | 'profile' | 'settings' | 'help'

function TopBarSkeleton() {
  return (
    <div className="flex items-center justify-between gap-4 px-5 pt-10 pb-4">
      <Skeleton className="h-10 w-10 rounded-xl" />
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-10 w-10 rounded-xl" />
    </div>
  )
}

function CardRows({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 rounded-lg bg-card border border-border/40 p-4">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      ))}
    </div>
  )
}

function CourseCards() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-lg bg-card border border-border/40">
          <Skeleton className="h-44 w-full rounded-none" />
          <div className="space-y-3 p-5">
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function StudentLoading({ variant = 'list' }: { variant?: Variant }) {
  if (variant === 'dashboard') {
    return (
      <div className="min-h-[100dvh] w-full page-enter space-y-6 bg-bg px-4 pb-32 pt-5 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
        <Skeleton className="h-44 w-full rounded-lg" />
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-lg bg-card border border-border/40 p-5 space-y-5">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <Skeleton className="h-7 w-12" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
        <CardRows count={3} />
      </div>
    )
  }

  if (variant === 'courses') {
    return (
      <div className="min-h-[100dvh] w-full page-enter bg-bg pb-28">
        <div className="space-y-5 border-b border-white/15 bg-primary-dark px-5 pb-6 pt-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-3 w-20 bg-white/25 dark:bg-white/20" />
              <Skeleton className="h-6 w-32 bg-white/30 dark:bg-white/20" />
            </div>
            <Skeleton className="h-9 w-9 rounded-full bg-white/25 dark:bg-white/20" />
          </div>
          <Skeleton className="h-12 w-full rounded-full bg-white/25 dark:bg-white/20" />
        </div>
        <div className="px-5 pt-5">
          <CourseCards />
        </div>
      </div>
    )
  }

  if (variant === 'detail') {
    return (
      <div className="min-h-[100dvh] w-full page-enter bg-bg pb-28">
        <TopBarSkeleton />
        <Skeleton className="h-56 w-full rounded-none" />
        <div className="space-y-4 px-5 pt-5">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-7 w-4/5" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-8 w-20 rounded-full" />
          </div>
          <CardRows count={4} />
        </div>
      </div>
    )
  }

  if (variant === 'lesson') {
    return (
      <div className="min-h-[100dvh] w-full page-enter space-y-4 bg-bg px-4 pb-28 pt-10 sm:px-5">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="aspect-video w-full rounded-lg" />
        <Skeleton className="h-6 w-4/5" />
        <Skeleton className="h-8 w-28 rounded-full" />
        <CardRows count={3} />
      </div>
    )
  }

  if (variant === 'profile') {
    return (
      <div className="min-h-[100dvh] w-full page-enter bg-bg pb-32">
        <div className="h-40 border-b border-white/15 bg-primary px-5 pt-8">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-10 rounded-xl bg-white/25 dark:bg-white/20" />
            <Skeleton className="h-5 w-24 bg-white/25 dark:bg-white/20" />
            <Skeleton className="h-10 w-10 rounded-xl bg-white/25 dark:bg-white/20" />
          </div>
        </div>
        <div className="-mt-16 px-6 space-y-5">
          <div className="rounded-lg bg-card border border-border/30 p-6 pt-8 text-center space-y-4">
            <Skeleton className="mx-auto h-24 w-24 rounded-full" />
            <Skeleton className="mx-auto h-5 w-40" />
            <Skeleton className="mx-auto h-3 w-28" />
            <CardRows count={3} />
          </div>
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      </div>
    )
  }

  if (variant === 'settings') {
    return (
      <div className="min-h-[100dvh] w-full page-enter bg-bg pb-28">
        <TopBarSkeleton />
        <div className="space-y-6 px-5">
          {Array.from({ length: 4 }).map((_, section) => (
            <div key={section} className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <div className="overflow-hidden rounded-lg bg-card border border-border/50">
                <CardRows count={section === 0 ? 1 : 2} />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (variant === 'help') {
    return (
      <div className="min-h-[100dvh] w-full page-enter bg-bg pb-28">
        <div className="space-y-5 border-b border-white/15 bg-primary-dark px-5 pb-6 pt-8">
          <div className="flex items-center justify-between">
            <Skeleton className="h-9 w-9 rounded-full bg-white/25 dark:bg-white/20" />
            <Skeleton className="h-5 w-32 bg-white/25 dark:bg-white/20" />
            <Skeleton className="h-9 w-9 rounded-full bg-white/25 dark:bg-white/20" />
          </div>
          <Skeleton className="h-11 w-full rounded-lg bg-white/25 dark:bg-white/20" />
        </div>
        <div className="px-5 pt-5">
          <CardRows count={5} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] w-full page-enter space-y-6 bg-bg px-4 pb-28 pt-10 sm:px-5">
      <TopBarSkeleton />
      <Skeleton className="h-14 w-full rounded-lg" />
      <CardRows count={5} />
    </div>
  )
}
