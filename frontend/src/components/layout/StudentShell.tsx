import BottomNav from './BottomNav'
import StudentRoutePrefetcher from './StudentRoutePrefetcher'

export default function StudentShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="student-shell mx-auto min-h-[100dvh] w-full max-w-md overflow-x-hidden bg-bg md:border-x md:border-border md:shadow-2xl">
      <BottomNav />
      <main className="min-h-[100dvh] w-full pb-[calc(5rem+env(safe-area-inset-bottom))]">
        {children}
      </main>

      <StudentRoutePrefetcher />
    </div>
  )
}
