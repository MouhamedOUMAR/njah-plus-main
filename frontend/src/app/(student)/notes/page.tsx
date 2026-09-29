import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/auth/get-session'
import { getAllNotes } from '@/actions/notes'
import NotesView from '@/components/notes/NotesView'

export default async function NotesPage() {
  const profile = await getProfile()
  if (!profile) redirect('/login')
  const notes = await getAllNotes()
  return <NotesView notes={notes} />
}
