'use client'
import { useEffect } from 'react'
import { recordHistory } from '@/actions/history'

export default function HistoryTracker({ lessonId }: { lessonId: string }) {
  useEffect(() => {
    recordHistory(lessonId)
  }, [lessonId])
  return null
}
