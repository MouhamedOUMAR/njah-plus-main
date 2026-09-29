'use client'

import { useState, useTransition } from 'react'
import { Settings2Icon, UserCheckIcon, UserXIcon } from 'lucide-react'
import { toggleStudentActive } from '@/actions/students'
import { useAdminT } from '@/components/admin/AdminI18n'
import type { SubscriptionStatus } from '@/types'
import SubscriptionModal from './SubscriptionModal'

interface Props {
  id: string
  name: string
  phone: string
  isActive: boolean
  subscriptionStatus: SubscriptionStatus | string
  subscriptionExpiresAt: string | null
}

export default function StudentSubscriptionActions({
  id,
  name,
  phone,
  isActive,
  subscriptionStatus,
  subscriptionExpiresAt,
}: Props) {
  const [pending, start] = useTransition()
  const [showModal, setShowModal] = useState(false)
  const adminT = useAdminT()

  function toggleActive() {
    start(() => toggleStudentActive(id, isActive))
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          onClick={toggleActive}
          disabled={pending}
          title={isActive ? adminT('students.disableAccount') : adminT('students.enableAccount')}
          className={`rounded-lg p-1.5 transition-colors disabled:opacity-50 ${
            isActive
              ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
              : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
          }`}
        >
          {isActive ? <UserXIcon size={14} /> : <UserCheckIcon size={14} />}
        </button>

        <button
          onClick={() => setShowModal(true)}
          disabled={pending}
          title={adminT('students.manageSubscription')}
          className="flex items-center gap-1 rounded-lg bg-primary/15 px-2.5 py-1.5 text-xs font-semibold text-cyan-300 transition-colors hover:bg-primary/25 disabled:opacity-50"
        >
          <Settings2Icon size={12} /> {adminT('students.manage')}
        </button>
      </div>

      <SubscriptionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        studentId={id}
        studentName={name}
        studentPhone={phone}
        currentExpiresAt={subscriptionExpiresAt}
        currentStatus={subscriptionStatus}
      />
    </>
  )
}
