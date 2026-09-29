'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import type { Profile } from '@/types'
import { useT } from '@/components/shared/LanguageProvider'

export default function ProfileEditForm({ profile }: { profile: Profile }) {
  const router = useRouter()
  const [name, setName] = useState(profile.full_name ?? '')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [, startTransition] = useTransition()
  const t = useT()

  function handleSave() {
    startTransition(async () => {
      const fullName = name.trim()
      setError('')
      if (fullName.length < 2 || fullName.length > 120) {
        setError(t.profile.invalidName)
        return
      }

      const supabase = createClient()
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', profile.id)

      if (updateError) {
        setError(t.profile.updateFailed)
        return
      }

      setName(fullName)
      setSaved(true)
      router.refresh()
      setTimeout(() => setSaved(false), 2000)
    })
  }

  return (
    <div className="space-y-3">
      <Input
        label={t.profile.fullName}
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder={t.profile.fullNamePlaceholder}
        maxLength={120}
      />
      <Button onClick={handleSave} variant={saved ? 'secondary' : 'primary'} size="sm">
        {saved ? `✓ ${t.profile.saved}` : t.profile.updateProfile}
      </Button>
      {error && <p className="text-xs font-semibold text-danger">{error}</p>}
    </div>
  )
}
