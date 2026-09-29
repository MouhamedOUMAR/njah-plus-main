'use client'

import { useEffect, useState } from 'react'
import { XIcon } from 'lucide-react'
import Button from '@/components/ui/Button'
import { manageStudentSubscription } from '@/actions/students'
import { useAdminT } from '@/components/admin/AdminI18n'

type PlanType = 'monthly' | '3_months' | 'yearly'
type ActionType = 'activate' | 'renew' | 'revoke' | 'block'
type PaymentMethod = 'Bankily' | 'Masrivi' | 'Sedad'

interface SubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  studentId: string
  studentName: string
  studentPhone: string
  currentExpiresAt?: string | null
  currentStatus: string
}

export default function SubscriptionModal({
  isOpen,
  onClose,
  studentId,
  studentName,
  studentPhone,
  currentExpiresAt,
  currentStatus,
}: SubscriptionModalProps) {
  const adminT = useAdminT()
  const [action, setAction] = useState<ActionType>(currentStatus === 'active' ? 'renew' : 'activate')
  const [planType, setPlanType] = useState<PlanType>('monthly')
  const [amountPaid, setAmountPaid] = useState('0')
  const [currency, setCurrency] = useState('MRU')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Bankily')
  const [paymentReference, setPaymentReference] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [projectedExpiry, setProjectedExpiry] = useState<Date | null>(null)

  useEffect(() => {
    if (action === 'revoke' || action === 'block') {
      setProjectedExpiry(null)
      return
    }

    let start = new Date()
    if (action === 'renew' && currentExpiresAt) {
      const currentExp = new Date(currentExpiresAt)
      if (currentExp > start) start = currentExp
    }

    const expiry = new Date(start)
    if (planType === 'monthly') expiry.setMonth(expiry.getMonth() + 1)
    if (planType === '3_months') expiry.setMonth(expiry.getMonth() + 3)
    if (planType === 'yearly') expiry.setFullYear(expiry.getFullYear() + 1)
    setProjectedExpiry(expiry)
  }, [action, planType, currentExpiresAt])

  if (!isOpen) return null

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      await manageStudentSubscription({
        studentId,
        action,
        planType: action === 'activate' || action === 'renew' ? planType : undefined,
        amountPaid: parseFloat(amountPaid) || 0,
        currency,
        paymentMethod,
        paymentReference,
        notes,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : adminT('common.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col rounded-lg border border-admin-border bg-admin-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-admin-border px-6 py-4">
          <h2 className="text-lg font-bold text-white">{adminT('students.manageSubscription')}</h2>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 transition-colors hover:text-white">
            <XIcon size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          <div className="mb-6 rounded-xl border border-white/5 bg-white/5 p-4">
            <p className="text-sm text-slate-400">{adminT('common.student')}</p>
            <p className="text-base font-semibold text-white">{studentName}</p>
            <p className="text-xs text-slate-500">{studentPhone}</p>
          </div>

          <form id="sub-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-400">{adminT('common.actions')}</label>
              <select
                value={action}
                onChange={event => setAction(event.target.value as ActionType)}
                className="w-full rounded-lg border border-admin-border bg-admin-bg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
              >
                <option value="activate">{adminT('subscriptions.activate')}</option>
                <option value="renew">{adminT('subscriptions.renew')}</option>
                <option value="revoke">{adminT('subscriptions.revoke')}</option>
                <option value="block">{adminT('subscriptions.block')}</option>
              </select>
            </div>

            {(action === 'activate' || action === 'renew') && (
              <>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-400">{adminT('common.plan')}</label>
                  <select
                    value={planType}
                    onChange={event => setPlanType(event.target.value as PlanType)}
                    className="w-full rounded-lg border border-admin-border bg-admin-bg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                  >
                    <option value="monthly">{adminT('subscriptions.monthly')}</option>
                    <option value="3_months">{adminT('subscriptions.quarterly')}</option>
                    <option value="yearly">{adminT('subscriptions.yearly')}</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-400">{adminT('subscriptions.amountPaid')}</label>
                    <input
                      type="number"
                      value={amountPaid}
                      onChange={event => setAmountPaid(event.target.value)}
                      className="w-full rounded-lg border border-admin-border bg-admin-bg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                      placeholder="500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-400">{adminT('subscriptions.currency')}</label>
                    <input
                      type="text"
                      value={currency}
                      onChange={event => setCurrency(event.target.value.toUpperCase())}
                      className="w-full rounded-lg border border-admin-border bg-admin-bg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-400">{adminT('subscriptions.paymentMethod')}</label>
                    <select
                      value={paymentMethod}
                      onChange={event => setPaymentMethod(event.target.value as PaymentMethod)}
                      className="w-full rounded-lg border border-admin-border bg-admin-bg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                    >
                      <option value="Bankily">Bankily</option>
                      <option value="Masrivi">Masrivi</option>
                      <option value="Sedad">Sedad</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-400">{adminT('subscriptions.paymentReference')}</label>
                    <input
                      type="text"
                      value={paymentReference}
                      onChange={event => setPaymentReference(event.target.value)}
                      className="w-full rounded-lg border border-admin-border bg-admin-bg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-400">{adminT('subscriptions.notes')}</label>
              <textarea
                value={notes}
                onChange={event => setNotes(event.target.value)}
                className="w-full resize-none rounded-lg border border-admin-border bg-admin-bg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                rows={2}
              />
            </div>

            {projectedExpiry && (
              <div className="mt-2 rounded-xl border border-primary/20 bg-primary/10 p-4">
                <p className="mb-1 text-xs text-primary/70">{adminT('subscriptions.projectedExpiration')}</p>
                <p className="text-sm font-bold text-primary">
                  {projectedExpiry.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            )}

            {error && <p className="text-sm text-red-400">{error}</p>}
          </form>
        </div>

        <div className="flex justify-end gap-3 rounded-b-2xl border-t border-admin-border bg-admin-bg p-4">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            {adminT('common.cancel')}
          </Button>
          <Button type="submit" form="sub-form" loading={loading} className="px-6 font-semibold shadow-lg shadow-primary/25">
            {adminT('common.confirm')}
          </Button>
        </div>
      </div>
    </div>
  )
}
