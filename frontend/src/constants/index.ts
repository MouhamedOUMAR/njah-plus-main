export const APP_NAME = 'najah+'
export const APP_ICON = '/najah-plus.jpeg'
export const APP_ICON_32 = '/icon-32.png'
export const APP_ICON_192 = '/icon-192.png'
export const APP_ICON_512 = '/icon-512.png'
export const APPLE_ICON = '/apple-icon.png'
export const APP_DESCRIPTION = 'Plateforme d\'apprentissage de l\'anglais pour les lycéens mauritaniens'

export const BAC_EXAM_DATE = new Date('2026-06-15')

export const SUPPORT_WHATSAPP = '41757591'
export const SUPPORT_WHATSAPP_DISPLAY = '41 75 75 91'
export const SUPPORT_WHATSAPP_URL = 'https://wa.me/22241757591'

export const MAURITANIA_PHONE_REGEX = /^222[234678]\d{7}$/

export const LICENSE_STRUCTURE = {
  L1: ['S1', 'S2'],
  L2: ['S3', 'S4'],
  L3: ['S5', 'S6'],
} as const

export const LICENSE_YEARS = Object.keys(LICENSE_STRUCTURE) as Array<keyof typeof LICENSE_STRUCTURE>
export const SEMESTERS = Object.values(LICENSE_STRUCTURE).flat()

export function isValidLicenseStructure(year: string, semester: string) {
  return year in LICENSE_STRUCTURE
    && (LICENSE_STRUCTURE[year as keyof typeof LICENSE_STRUCTURE] as readonly string[]).includes(semester)
}
export const ROUTES = {
  home: '/',
  login: '/login',
  verifyOtp: '/verify-otp',
  dashboard: '/dashboard',
  courses: '/courses',
  notes: '/notes',
  history: '/history',
  notifications: '/notifications',
  profile: '/profile',
  settings: '/settings',
  help: '/help',
  admin: '/admin',
  adminStudents: '/admin/students',
  adminCourses: '/admin/courses',
  adminLessons: '/admin/lessons',
  adminNotifications: '/admin/notifications',
  adminAnalytics: '/admin/analytics',
} as const
