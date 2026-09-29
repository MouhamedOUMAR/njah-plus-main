import { adminGetAllNotes } from '@/actions/notes'
import { requireAdmin } from '@/lib/auth/get-session'
import AdminNotesView from '@/components/admin/AdminNotesView'

export const dynamic = 'force-dynamic'

export default async function AdminNotesPage() {
  await requireAdmin()
  const notes = await adminGetAllNotes()

  return <AdminNotesView initialNotes={notes} />
}
