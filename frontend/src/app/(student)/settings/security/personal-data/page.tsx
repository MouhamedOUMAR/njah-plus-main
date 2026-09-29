import { requireAuth } from '@/lib/auth/get-session'
import PersonalDataView from '@/components/settings/PersonalDataView'

export default async function PersonalDataPage() {
  const { profile } = await requireAuth()
  return <PersonalDataView profile={profile} />
}
