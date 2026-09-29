import { getCourses } from '@/actions/courses'
import CoursesView from '@/components/courses/CoursesView'

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; year?: string; semester?: string }>
}) {
  const { q, year, semester } = await searchParams
  const filtered = await getCourses({ q, licenseYear: year, semester })

  return <CoursesView courses={filtered} />
}
