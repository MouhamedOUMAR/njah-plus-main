import { requireAdmin } from '@/lib/auth/get-session'
import AdminSidebar from '@/components/layout/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin()
  return (
    <div className="min-h-screen bg-admin-bg">
      <AdminSidebar />
      <main className="min-w-0 pb-24 pt-16 md:ms-60 md:pb-0 md:pt-0">
        {children}
      </main>
    </div>
  )
}
