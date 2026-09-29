'use client'
import { useT } from '@/components/shared/LanguageProvider'

interface Props {
  path: string
}

export default function I18nText({ path }: Props) {
  const t = useT()
  const value = path.split('.').reduce<unknown>((current, key) => {
    if (current && typeof current === 'object' && key in current) {
      return (current as Record<string, unknown>)[key]
    }
    return undefined
  }, t)

  return <>{typeof value === 'string' ? value : path}</>
}
